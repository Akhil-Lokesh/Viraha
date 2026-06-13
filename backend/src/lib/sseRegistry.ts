import type { Response } from 'express';

type Listener = Response;

const registry = new Map<string, Set<Listener>>();

export function register(userId: string, res: Listener): void {
  let listeners = registry.get(userId);
  if (!listeners) {
    listeners = new Set();
    registry.set(userId, listeners);
  }
  listeners.add(res);
}

export function unregister(userId: string, res: Listener): void {
  const listeners = registry.get(userId);
  if (!listeners) return;
  listeners.delete(res);
  if (listeners.size === 0) registry.delete(userId);
}

export function push(userId: string, event: string, data: unknown): void {
  const listeners = registry.get(userId);
  if (!listeners || listeners.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const res of listeners) {
    try {
      if (res.writableEnded || res.destroyed) {
        listeners.delete(res);
        continue;
      }
      res.write(payload);
    } catch {
      listeners.delete(res);
    }
  }

  if (listeners.size === 0) registry.delete(userId);
}

export function listenerCount(userId: string): number {
  return registry.get(userId)?.size ?? 0;
}

// Test helper — clears all listeners
export function _resetRegistry(): void {
  registry.clear();
}
