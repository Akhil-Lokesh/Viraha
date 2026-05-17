import { doubleCsrf } from 'csrf-csrf';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

const { doubleCsrfProtection: realDoubleCsrfProtection, generateCsrfToken: realGenerateCsrfToken } =
  doubleCsrf({
    getSecret: () => env.JWT_SECRET,
    getSessionIdentifier: (req: Request) => req.cookies?.viraha_access || req.ip || 'anonymous',
    cookieName: 'viraha_csrf',
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax' as const,
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
