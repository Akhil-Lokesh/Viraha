import { doubleCsrf } from 'csrf-csrf';
import { Request } from 'express';
import { env } from '../config/env';

const isProduction = env.NODE_ENV === 'production';

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET || env.JWT_SECRET,
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

export { doubleCsrfProtection, generateCsrfToken };
