import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

let redis: Redis | null = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  redis.connect().catch(() => {
    logger.warn('Redis failed to connect — caching disabled');
    redis = null;
  });
}

export { redis };
