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
function createStore(prefix: string): Store | undefined {
  const client = redis;
  if (!client) return undefined;
  return new RedisStore({
    prefix,
    // ioredis `.call` is typed via overloads (command, ...args) rather than the
    // variadic SendCommandFn signature rate-limit-redis expects, so cast args.
    sendCommand: (...args: string[]) =>
      client.call(...(args as [string, ...string[]])) as Promise<RedisReply>,
  });
}

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: createStore('rl:api:'),
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
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Upload limit reached, please try again later.' },
  },
});
