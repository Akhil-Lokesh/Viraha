import { initSentry } from './lib/sentry';

// Initialize Sentry before importing app
initSentry();

import app from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { shutdownRealtime } from './lib/realtime';
import { startJobs, stopJobs } from './jobs/scheduler';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Viraha API started');
  startJobs();
});

let shuttingDown = false;

function gracefulShutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutdown signal received — closing server');

  // Failsafe: force exit if connections do not drain in time.
  const failsafe = setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10000);
  failsafe.unref();

  stopJobs();
  try {
    shutdownRealtime();
  } catch (err) {
    logger.error({ err }, 'Error shutting down realtime connections');
  }

  server.close(async () => {
    try {
      await prisma.$disconnect();
      if (redis) await redis.quit();
      logger.info('Cleanup complete — exiting');
      clearTimeout(failsafe);
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown cleanup');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
