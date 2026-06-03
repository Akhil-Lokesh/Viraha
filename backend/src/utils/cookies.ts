import { Response, CookieOptions } from 'express';
import { env } from '../config/env';

const isProduction = env.NODE_ENV === 'production';

const BASE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  // Cross-site in prod (Vercel frontend ↔ Railway backend) requires SameSite=None;
  // None mandates Secure, which holds in production. Keep Lax locally (same-site, no HTTPS).
  sameSite: isProduction ? 'none' : 'lax',
};

const ACCESS_COOKIE = 'viraha_access';
const REFRESH_COOKIE = 'viraha_refresh';
const SESSION_COOKIE = 'viraha_session_id';

const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 min
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_MAX_AGE = REFRESH_MAX_AGE; // session lives as long as the refresh token

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

/**
 * Non-path-scoped session identifier cookie. Unlike the refresh cookie
 * (scoped to /api/v1/auth/refresh), this is sent on every request so the
 * CSRF middleware can derive one stable session identifier for both token
 * minting and validation, including on the refresh endpoint.
 */
export function setSessionIdCookie(res: Response, sessionId: string): void {
  res.cookie(SESSION_COOKIE, sessionId, {
    ...BASE_OPTIONS,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...BASE_OPTIONS, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...BASE_OPTIONS, path: '/api/v1/auth/refresh' });
  res.clearCookie(SESSION_COOKIE, { ...BASE_OPTIONS, path: '/' });
}
