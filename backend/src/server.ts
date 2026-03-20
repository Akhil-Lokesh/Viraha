import { initSentry } from './lib/sentry';

// Initialize Sentry before importing app
initSentry();

import app from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Viraha API started');
});
