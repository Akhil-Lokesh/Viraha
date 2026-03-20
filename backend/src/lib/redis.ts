import Redis from 'ioredis';
import { env } from '../config/env';

let redis: Redis | null = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  redis.on('connect', () => {
    console.log('[Redis] Connected');
  });

  redis.connect().catch(() => {
    console.warn('[Redis] Failed to connect — caching disabled');
    redis = null;
  });
}

export { redis };
