import { env } from '../config/env';

type SentryModule = typeof import('@sentry/node');

let sentryModulePromise: Promise<SentryModule> | null = null;

function getSentry(): Promise<SentryModule> {
  sentryModulePromise ??= import('@sentry/node');
  return sentryModulePromise;
}

export function initSentry(): void {
  if (!env.SENTRY_DSN) return;

  getSentry()
    .then((Sentry) => {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
        beforeSend(event) {
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
          return event;
        },
      });
    })
    .catch(() => {});
}

export function captureException(err: unknown): void {
  if (!env.SENTRY_DSN) return;

  getSentry()
    .then((Sentry) => {
      Sentry.captureException(err);
    })
    .catch(() => {});
}
