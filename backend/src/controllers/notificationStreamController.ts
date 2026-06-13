import { Request, Response, NextFunction } from 'express';
import * as sseRegistry from '../lib/sseRegistry';

const HEARTBEAT_INTERVAL_MS = 30_000;

export function streamNotifications(req: Request, res: Response, _next: NextFunction): void {
  const userId = req.user!.userId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Initial comment to open the stream
  res.write(`: connected ${Date.now()}\n\n`);

  sseRegistry.register(userId, res);

  const heartbeat = setInterval(() => {
    if (res.writableEnded || res.destroyed) {
      clearInterval(heartbeat);
      sseRegistry.unregister(userId, res);
      return;
    }
    try {
      res.write(`: ping ${Date.now()}\n\n`);
    } catch {
      clearInterval(heartbeat);
      sseRegistry.unregister(userId, res);
    }
  }, HEARTBEAT_INTERVAL_MS);

  const cleanup = () => {
    clearInterval(heartbeat);
    sseRegistry.unregister(userId, res);
  };

  req.on('close', cleanup);
  req.on('error', cleanup);
  res.on('close', cleanup);
  res.on('error', cleanup);
}
