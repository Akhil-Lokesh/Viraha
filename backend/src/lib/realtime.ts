import { Request, Response } from 'express';
import Redis from 'ioredis';
import { redis } from './redis';
import { logger } from './logger';

const MAX_CONNECTIONS_PER_USER = 5;
const HEARTBEAT_INTERVAL_MS = 25_000;
const ACTIVITY_CHANNEL = 'viraha:activity';
// How long a publish waits for the subscriber's SUBSCRIBE to confirm before
// falling back to in-process delivery.
const SUBSCRIBE_WAIT_MS = 500;

// Per-user SSE connection registry
const registry = new Map<string, Set<Response>>();
const heartbeatTimers = new Map<Response, NodeJS.Timeout>();

let subscriber: Redis | null = null;
// Settled/in-flight outcome of the SUBSCRIBE command. `null` means there is
// no active subscriber and the next publish/connection must (re-)subscribe.
let subscribePromise: Promise<boolean> | null = null;

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
 * Tear down the current subscriber (if any) and clear subscription state so
 * the next publish/connection re-subscribes from scratch.
 */
function resetSubscriber(): void {
  const sub = subscriber;
  subscriber = null;
  subscribePromise = null;
  if (sub) {
    try {
      sub.disconnect();
    } catch (err) {
      logger.debug({ err }, 'Failed to disconnect realtime subscriber');
    }
  }
}

/**
 * Lazily initialize the Redis pub/sub subscriber and return a promise that
 * resolves true once SUBSCRIBE is confirmed. Any failure (init error,
 * SUBSCRIBE rejection, connection drop) resets state so the next call
 * re-subscribes — all failures degrade gracefully to in-process delivery.
 */
function ensureSubscriber(): Promise<boolean> {
  if (!redis) return Promise.resolve(false);
  if (subscribePromise) return subscribePromise;

  let sub: Redis;
  try {
    sub = redis.duplicate();
  } catch (err) {
    logger.debug({ err }, 'Failed to initialize realtime subscriber');
    return Promise.resolve(false);
  }

  subscriber = sub;
  sub.on('error', (err) => {
    logger.debug({ err }, 'Realtime subscriber error');
    if (subscriber === sub) resetSubscriber();
  });
  sub.on('end', () => {
    // Connection is gone for good — allow a future publish/connection to
    // create a fresh subscriber instead of staying dead forever.
    if (subscriber === sub) resetSubscriber();
  });
  sub.on('message', (channel: string, message: string) => {
    if (channel === ACTIVITY_CHANNEL) handleSubscriberMessage(message);
  });

  subscribePromise = sub.subscribe(ACTIVITY_CHANNEL).then(
    () => subscriber === sub,
    (err: unknown) => {
      logger.debug({ err }, 'Realtime subscriber failed to subscribe');
      if (subscriber === sub) resetSubscriber();
      return false;
    }
  );
  return subscribePromise;
}

/** Resolve `promise` but give up (resolve false) after `ms` milliseconds. */
function waitWithTimeout(promise: Promise<boolean>, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    timer.unref();
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(false);
      }
    );
  });
}

function safeDeliverLocal(userId: string, payload: Record<string, unknown>): void {
  try {
    deliverLocal(userId, payload);
  } catch (err) {
    logger.debug({ err }, 'In-process activity delivery failed');
  }
}

/**
 * Publish an activity notification for a user. Uses Redis pub/sub when
 * available (multi-instance delivery). Exactly one delivery path serves the
 * local instance per event: the Redis subscriber when its subscription is
 * confirmed, otherwise direct in-process delivery (Redis absent, publish
 * failed, or subscription failed/not ready in time). Never throws.
 */
export async function publishActivity(
  userId: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!redis) {
    safeDeliverLocal(userId, payload);
    return;
  }

  // Await subscription readiness BEFORE publishing so the decision between
  // "subscriber delivers" and "deliver locally" is made against a confirmed
  // state — never both paths for one event.
  const subscribed = await waitWithTimeout(ensureSubscriber(), SUBSCRIBE_WAIT_MS);
  if (!subscribed) {
    // Warm-up timed out or subscription failed: tear the subscriber down so a
    // late-confirming subscription cannot also deliver this event.
    resetSubscriber();
  }

  let published = false;
  try {
    await redis.publish(ACTIVITY_CHANNEL, JSON.stringify({ userId, payload }));
    published = true;
  } catch (err) {
    logger.debug({ err }, 'Redis publish failed — falling back to in-process delivery');
  }

  if (!subscribed || !published) {
    safeDeliverLocal(userId, payload);
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

  // Kick off (re-)subscription eagerly; publishes await its outcome.
  void ensureSubscriber();

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
      // res.end() alone does not guarantee the TCP socket closes before
      // server.close() drains — destroy the socket so shutdown is
      // deterministic instead of waiting on client FIN acknowledgement.
      try {
        res.socket?.destroy();
      } catch (err) {
        logger.debug({ err }, 'Failed to destroy SSE socket during shutdown');
      }
    }
  }
  registry.clear();
  for (const timer of heartbeatTimers.values()) {
    clearInterval(timer);
  }
  heartbeatTimers.clear();

  resetSubscriber();
}
