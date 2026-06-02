import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, prisma } from './factories';
import { generateRefreshToken } from '../utils/jwt';

/**
 * Deactivated-account auth coverage.
 *
 * Verified against src/controllers/authController.ts:
 *   - login(): after a valid email + password, an inactive user (isActive === false)
 *     is rejected with 403 / error.code 'FORBIDDEN' / 'Account has been deactivated'.
 *   - refreshTokenHandler(): reads the `viraha_refresh` cookie, looks the plaintext
 *     token up in the refresh_tokens table, then loads the user; if the user is not
 *     active it 403s, deletes ALL of that user's refresh tokens
 *     (deleteMany by userId), and clears the auth cookies.
 *
 * createTestUser seeds password "password123", which is what comparePassword checks.
 */
describe('Deactivated-account auth', () => {
  async function issueRefreshToken(userId: string): Promise<string> {
    const token = generateRefreshToken(userId);
    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return token;
  }

  describe('POST /api/v1/auth/login', () => {
    it('should return 403 for a deactivated user with otherwise-correct credentials', async () => {
      const user = await createTestUser({ isActive: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('FORBIDDEN');
    });

    it('should not set auth cookies when a deactivated user logs in', async () => {
      const user = await createTestUser({ isActive: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'password123' });

      expect(res.status).toBe(403);

      const setCookieHeader = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : setCookieHeader
          ? [setCookieHeader]
          : [];
      expect(cookies.some((c: string) => c.startsWith('viraha_access='))).toBe(false);
      expect(cookies.some((c: string) => c.startsWith('viraha_refresh='))).toBe(false);
    });

    it('should still 401 (not 403) for a deactivated user with the wrong password', async () => {
      // Password is checked before the isActive gate, so a bad password masks
      // the deactivated state with the generic credential error.
      const user = await createTestUser({ isActive: false });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body.error?.code).toBe('UNAUTHORIZED');
    });

    it('should log in an active user with the same credentials', async () => {
      // Control: confirms the 403 above is driven by isActive, not by the factory.
      const user = await createTestUser({ isActive: true });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(user.id);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 403 and revoke all refresh tokens when the account is deactivated', async () => {
      // Start from an active user with a persisted refresh token (the normal
      // post-login state), then deactivate and attempt a refresh.
      const user = await createTestUser({ isActive: true });
      const refreshToken = await issueRefreshToken(user.id);
      // A second token for the same user simulates another active session/device.
      const secondToken = await issueRefreshToken(user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${refreshToken}`])
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('FORBIDDEN');

      // All of the user's refresh tokens must be deleted (deleteMany by userId),
      // not just the one presented in the cookie.
      const remaining = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });
      expect(remaining).toHaveLength(0);

      const presented = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      expect(presented).toBeNull();
      const other = await prisma.refreshToken.findUnique({
        where: { token: secondToken },
      });
      expect(other).toBeNull();
    });

    it('should clear auth cookies in the response when the account is deactivated', async () => {
      const user = await createTestUser({ isActive: true });
      const refreshToken = await issueRefreshToken(user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${refreshToken}`])
        .send({});

      expect(res.status).toBe(403);

      const setCookieHeader = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : setCookieHeader
          ? [setCookieHeader]
          : [];
      // clearAuthCookies emits Set-Cookie entries that zero out the values.
      expect(cookies.some((c: string) => c.startsWith('viraha_access=;'))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('viraha_refresh=;'))).toBe(true);
    });

    it('should not issue a new refresh token to a deactivated account', async () => {
      const user = await createTestUser({ isActive: true });
      const refreshToken = await issueRefreshToken(user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${refreshToken}`])
        .send({});

      expect(res.status).toBe(403);

      const setCookieHeader = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : setCookieHeader
          ? [setCookieHeader]
          : [];
      // No fresh, non-empty refresh cookie should be granted.
      const freshRefresh = cookies.some(
        (c: string) => c.startsWith('viraha_refresh=') && !c.startsWith('viraha_refresh=;'),
      );
      expect(freshRefresh).toBe(false);
    });
  });
});
