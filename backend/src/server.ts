import { initSentry } from './lib/sentry';

// Initialize Sentry before importing app
initSentry();

import app from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`Viraha API running on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
