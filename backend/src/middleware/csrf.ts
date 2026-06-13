import { doubleCsrf } from 'csrf-csrf';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

const { doubleCsrfProtection: realDoubleCsrfProtection, generateCsrfToken: realGenerateCsrfToken } =
  doubleCsrf({
    getSecret: () => env.CSRF_SECRET || env.JWT_SECRET,
    // Prefer the non-path-scoped session cookie so the same identifier is used at
    // token-mint time and at validation time on every route — including
    // /auth/refresh, where the path-scoped refresh cookie would otherwise differ.
    getSessionIdentifier: (req: Request) =>
      req.cookies?.viraha_session_id ||
      req.cookies?.viraha_refresh ||
      req.ip ||
      req.socket?.remoteAddress ||
      randomUUID(),
    cookieName: 'viraha_csrf',
    cookieOptions: {
      httpOnly: true,
      // Cross-site in prod requires SameSite=None (mandates Secure, which holds in prod).
      // Keep Lax locally to avoid requiring HTTPS in development.
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      path: '/',
    },
    getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string,
  });

// In test mode, CSRF is a no-op so integration tests can POST without juggling tokens.
// generateCsrfToken still returns a stable string so token endpoints don't crash.
const doubleCsrfProtection = isTest
  ? (_req: Request, _res: Response, next: NextFunction) => next()
  : realDoubleCsrfProtection;

const generateCsrfToken = isTest
  ? (_req: Request, _res: Response) => 'test-csrf-token'
  : realGenerateCsrfToken;

export { doubleCsrfProtection, generateCsrfToken };
