import { Response, CookieOptions } from 'express';
import { env } from '../config/env';

const isProduction = env.NODE_ENV === 'production';

const BASE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
};

const ACCESS_COOKIE = 'viraha_access';
const REFRESH_COOKIE = 'viraha_refresh';

const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 min
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie(ACCESS_COOKIE, token, {
    ...BASE_OPTIONS,
    path: '/',
    maxAge: ACCESS_MAX_AGE,
  });
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    ...BASE_OPTIONS,
    path: '/api/v1/auth/refresh',
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...BASE_OPTIONS, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...BASE_OPTIONS, path: '/api/v1/auth/refresh' });
}
