import dotenv from 'dotenv';
import { z } from 'zod/v4';

dotenv.config();

const PLACEHOLDER_SECRETS = [
  'change-this-to-a-random-secret-key',
  'change-this',
  'your-secret-here',
  'secret',
  'jwt-secret',
  'changeme',
  'change_me',
  'change-me',
  'placeholder',
];

const TRUTHY_FLAGS = ['1', 'true', 'yes', 'on', 'enabled'];
const FALSY_FLAGS = ['0', 'false', 'no', 'off', 'disabled'];

/**
 * Parse a boolean-ish env flag. Returns undefined for unset or unrecognized
 * values (unrecognized values are warned about after parsing, below).
 */
function parseEnvFlag(value: unknown): boolean | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (TRUTHY_FLAGS.includes(normalized)) return true;
  if (FALSY_FLAGS.includes(normalized)) return false;
  return undefined;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CSRF_SECRET: z.string().min(32).optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  // Cloudflare R2 (optional — falls back to local disk)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  // Redis (optional — caching disabled if not set)
  REDIS_URL: z.string().optional(),
  // Sentry (optional — error tracking disabled if not set)
  SENTRY_DSN: z.string().optional(),
  // Google Places (optional — location autocomplete disabled if not set)
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  // Resend (optional — email sending disabled if not set)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional().default('noreply@viraha.app'),
  // Google OAuth (optional — Sign-in-with-Google disabled if not set)
  GOOGLE_CLIENT_ID: z.string().optional(),
  // Background jobs (optional — when unset, jobs run only in production).
  // Accepted: 1/0, true/false, yes/no, on/off, enabled/disabled (case-insensitive).
  ENABLE_JOBS: z.preprocess(parseEnvFlag, z.boolean().optional()),
}).refine(
  (data) => {
    if (data.NODE_ENV !== 'production') return true;
    const isPlaceholder = (val: string) =>
      PLACEHOLDER_SECRETS.some((p) => val.toLowerCase().includes(p));
    if (isPlaceholder(data.JWT_SECRET) || isPlaceholder(data.JWT_REFRESH_SECRET)) return false;
    // CSRF_SECRET is required in production and must not be a placeholder.
    if (!data.CSRF_SECRET || isPlaceholder(data.CSRF_SECRET)) return false;
    return true;
  },
  { message: 'JWT_SECRET, JWT_REFRESH_SECRET, and CSRF_SECRET must be set to non-placeholder values in production' },
).refine(
  (data) => {
    if (data.NODE_ENV !== 'production') return true;
    // In production, object storage (R2) must be fully configured.
    // Local-disk fallback is not served in production (see app.ts) and is
    // lost on container restart, so missing R2 config silently drops media.
    return Boolean(
      data.R2_ACCOUNT_ID &&
        data.R2_ACCESS_KEY_ID &&
        data.R2_SECRET_ACCESS_KEY &&
        data.R2_BUCKET &&
        data.R2_PUBLIC_URL,
    );
  },
  {
    message:
      'R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, and R2_PUBLIC_URL must all be set in production (local-disk storage is not served in production and is lost on restart)',
  },
).refine(
  (data) => {
    if (data.NODE_ENV !== 'production') return true;
    // CORS_ORIGIN must be an explicit production origin, never the localhost default.
    const origins = data.CORS_ORIGIN.split(',').map((o) => o.trim());
    if (origins.length === 0 || origins.some((o) => o.length === 0)) return false;
    return origins.every((o) => !o.toLowerCase().includes('localhost'));
  },
  {
    message:
      'CORS_ORIGIN must be set to your production frontend origin(s) and must not contain "localhost" in production',
  },
);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // The logger imports env transitively, so it cannot be used safely here.
  // Emit a structured fatal record straight to stderr instead.
  process.stderr.write(
    JSON.stringify({
      level: 'fatal',
      msg: 'Invalid environment variables',
      errors: parsed.error.format(),
    }) + '\n'
  );
  process.exit(1);
}

// Warn once (module loads once) when ENABLE_JOBS is set to something we do
// not recognize — the value is otherwise silently ignored and the
// NODE_ENV-based default applies. Logger imports env transitively, so write
// the structured warning straight to stderr like the fatal path above.
if (process.env.ENABLE_JOBS !== undefined && parsed.data.ENABLE_JOBS === undefined) {
  process.stderr.write(
    JSON.stringify({
      level: 'warn',
      msg: 'Unrecognized ENABLE_JOBS value — ignoring it and falling back to the NODE_ENV default (enabled only in production)',
      value: process.env.ENABLE_JOBS,
    }) + '\n'
  );
}

export const env = parsed.data;
