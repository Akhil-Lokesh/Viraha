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
];

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
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
}).refine(
  (data) => {
    if (data.NODE_ENV !== 'production') return true;
    const isPlaceholder = (val: string) =>
      PLACEHOLDER_SECRETS.some((p) => val.toLowerCase().includes(p));
    return !isPlaceholder(data.JWT_SECRET) && !isPlaceholder(data.JWT_REFRESH_SECRET);
  },
  { message: 'JWT_SECRET and JWT_REFRESH_SECRET must not be placeholder values in production' },
);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
