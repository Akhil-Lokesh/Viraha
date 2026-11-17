import { redis } from './redis';
import { decimalsAsNumbers } from '../utils/json';

/**
 * Get a cached value by key. Returns null if not cached or Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with a TTL in seconds.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value, decimalsAsNumbers), 'EX', ttlSeconds);
  } catch {
    // Caching is best-effort
  }
}

/**
 * Delete a cached key.
 */
export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Best-effort
  }
}
