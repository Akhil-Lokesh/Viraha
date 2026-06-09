import { Request, Response } from 'express';
import Redis from 'ioredis';
import { redis } from './redis';
import { logger } from './logger';

const MAX_CONNECTIONS_PER_USER = 5;
const HEARTBEAT_INTERVAL_MS = 25_000;
const ACTIVITY_CHANNEL = 'viraha:activity';

// Per-user SSE connection registry
const registry = new Map<string, Set<Response>>();
const heartbeatTimers = new Map<Response, NodeJS.Timeout>();

let subscriber: Redis | null = null;
let subscriberInitialized = false;
let subscriberReady = false;

/**
 * Register an SSE connection for a user. Caps connections per user;
 * the oldest connection is closed when the cap is exceeded.
 */
export function registerConnection(userId: string, res: Response): void {
  let set = registry.get(userId);
  if (!set) {
    set = new Set<Response>();
    registry.set(userId, set);
  }
  while (set.size >= MAX_CONNECTIONS_PER_USER) {
    const oldest = set.values().next().value;
    if (!oldest) break;
    closeConnection(userId, oldest);
  }
  set.add(res);
}

/**
 * Remove an SSE connection from the registry and clear its heartbeat.
 */
export function deregisterConnection(userId: string, res: Response): void {
  const timer = heartbeatTimers.get(res);
  if (timer) {
    clearInterval(timer);
    heartbeatTimers.delete(res);
  }
  const set = registry.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) registry.delete(userId);
}

/**
 * Number of active SSE connections for a user (test helper).
 */
export function getConnectionCount(userId: string): number {
  return registry.get(userId)?.size ?? 0;
}

function closeConnection(userId: string, res: Response): void {
  deregisterConnection(userId, res);
  try {
    res.end();
  } catch (err) {
    logger.debug({ err }, 'Failed to close SSE connection');
  }
}

function deliverLocal(userId: string, payload: Record<string, unknown>): void {
  const set = registry.get(userId);
  if (!set || set.size === 0) return;
  const frame = `event: activity\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      res.write(frame);
    } catch (err) {
      logger.debug({ err }, 'SSE write failed');
    }
  }
}

function handleSubscriberMessage(message: string): void {
  try {
    const parsed: unknown = JSON.parse(message);
    if (!parsed || typeof parsed !== 'object') return;
    const { userId, payload } = parsed as { userId?: unknown; payload?: unknown };
    if (typeof userId !== 'string' || !payload || typeof payload !== 'object') return;
    deliverLocal(userId, payload as Record<string, unknown>);
  } catch (err) {
    logger.debug({ err }, 'Failed to parse realtime pub/sub message');
  }
}

/**
 * Lazily initialize the Redis pub/sub subscriber on first SSE connection.
 * All failures degrade gracefully to in-process delivery.
 */
function ensureSubscriber(): void {
  if (subscriberInitialized || !redis) return;
  subscriberInitialized = true;
  try {
    subscriber = redis.duplicate();
    subscriber.on('error', (err) => {
      subscriberReady = false;
      logger.debug({ err }, 'Realtime subscriber error');
    });
    subscriber.on('end', () => {
      subscriberReady = false;
    });
    subscriber.on('message', (channel: string, message: string) => {
      if (channel === ACTIVITY_CHANNEL) handleSubscriberMessage(message);
    });
    subscriber
      .subscribe(ACTIVITY_CHANNEL)
      .then(() => {
        subscriberReady = true;
      })
      .catch((err: unknown) => {
        subscriberReady = false;
        logger.debug({ err }, 'Realtime subscriber failed to subscribe');
      });
  } catch (err) {
    subscriber = null;
    logger.debug({ err }, 'Failed to initialize realtime subscriber');
  }
}

/**
 * Publish an activity notification for a user. Uses Redis pub/sub when
 * available (multi-instance delivery); falls back to direct in-process
 * delivery when Redis is unavailable or the local subscriber is not ready.
 * Never throws.
 */
export async function publishActivity(
  userId: string,
  payload: Record<string, unknown>
): Promise<void> {
  let published = false;
  if (redis) {
    try {
      await redis.publish(ACTIVITY_CHANNEL, JSON.stringify({ userId, payload }));
      published = true;
    } catch (err) {
      logger.debug({ err }, 'Redis publish failed — falling back to in-process delivery');
    }
  }
  // If the message did not go through Redis, or this instance's subscriber
  // is not listening, deliver directly to local connections.
  if (!published || !subscriberReady) {
    try {
      deliverLocal(userId, payload);
    } catch (err) {
      logger.debug({ err }, 'In-process activity delivery failed');
    }
  }
}

/**
 * Express handler for GET /api/v1/activities/stream (SSE).
 * Requires the authenticate middleware to have populated req.user.
 */
export function sseHandler(req: Request, res: Response): void {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  ensureSubscriber();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  registerConnection(userId, res);
  res.write('event: connected\ndata: {}\n\n');

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (err) {
      logger.debug({ err }, 'SSE heartbeat write failed');
    }
  }, HEARTBEAT_INTERVAL_MS);
  heartbeatTimers.set(res, heartbeat);

  req.on('close', () => {
    deregisterConnection(userId, res);
  });
}

/**
 * Close all SSE connections and tear down the Redis subscriber.
 * Imported by server.ts during graceful shutdown.
 */
export function shutdownRealtime(): void {
  for (const [userId, set] of [...registry.entries()]) {
    for (const res of [...set]) {
      closeConnection(userId, res);
    }
  }
  registry.clear();
  for (const timer of heartbeatTimers.values()) {
    clearInterval(timer);
  }
  heartbeatTimers.clear();

  if (subscriber) {
    try {
      subscriber.disconnect();
    } catch (err) {
      logger.debug({ err }, 'Failed to disconnect realtime subscriber');
    }
    subscriber = null;
  }
  subscriberInitialized = false;
  subscriberReady = false;
}
