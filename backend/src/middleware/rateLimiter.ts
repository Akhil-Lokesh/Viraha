import rateLimit, { type Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { RedisReply } from 'rate-limit-redis';
import { redis } from '../lib/redis';

/**
 * Build a Redis-backed store so limits hold across Railway replicas and survive
 * restarts. Falls back to the default in-memory store when Redis is unavailable
 * (e.g. local dev without REDIS_URL). Each limiter passes a distinct key prefix
 * so its counter is independent — the default IP-based key generator is not
 * path-aware, so sharing the default `rl:` prefix would collide the limiters.
 */
export function createStore(prefix: string): Store | undefined {
  if (!redis) return undefined;
  return new RedisStore({
    prefix,
    // Read the module-level `redis` binding at call time (not a captured copy):
    // lib/redis.ts sets it to null if the connection ultimately fails, so a stale
    // captured client would keep throwing. Combined with passOnStoreError on each
    // limiter, a Redis outage degrades to no-op limiting instead of 500ing every
    // request that hits a rate-limited endpoint.
    sendCommand: (...args: string[]) => {
      if (!redis) return Promise.reject(new Error('redis unavailable'));
      // ioredis `.call` is typed via overloads (command, ...args) rather than the
      // variadic SendCommandFn signature rate-limit-redis expects, so cast args.
      return redis.call(...(args as [string, ...string[]])) as Promise<RedisReply>;
    },
  });
}

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('rl:api:'),
  passOnStoreError: true,
  // Disable throttling under the test runner so integration tests are deterministic.
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
  },
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('rl:auth:'),
  passOnStoreError: true,
  // Disable throttling under the test runner so integration tests are deterministic.
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later.' },
  },
});

// Search / autocomplete limiter
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('rl:search:'),
  passOnStoreError: true,
  // Disable throttling under the test runner so integration tests are deterministic.
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many search requests, please try again later.' },
  },
});

// Upload limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('rl:upload:'),
  passOnStoreError: true,
  // Disable throttling under the test runner so integration tests are deterministic.
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Upload limit reached, please try again later.' },
  },
});
