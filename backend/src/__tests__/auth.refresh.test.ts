import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { createTestUser, prisma } from './factories';
import { generateRefreshToken } from '../utils/jwt';

/**
 * Regression tests for the auth fixes shipped in commit 46ffed7:
 *   - `/auth/refresh` no longer runs an empty-body validator, so it succeeds
 *     with a valid refresh cookie and an empty JSON body.
 *   - `/auth/logout` uses `optionalAuth` so it returns 200 even with no
 *     access cookie (idempotent client logout).
 */
describe('Auth refresh & logout regression', () => {
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

  describe('POST /api/v1/auth/refresh', () => {
    it('should return new tokens with a valid refresh cookie and empty body', async () => {
      const user = await createTestUser();
      const refreshToken = await issueRefreshToken(user.id);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${refreshToken}`])
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Should set new access and refresh cookies
      const setCookieHeader = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : setCookieHeader
          ? [setCookieHeader]
          : [];
      expect(cookies.some((c: string) => c.startsWith('viraha_access='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('viraha_refresh='))).toBe(true);

      // Old refresh token should have been rotated out of the database
      const oldRow = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
      expect(oldRow).toBeNull();
    });

    it('should return 401 when no refresh cookie is present', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 and delete the row when the refresh token is expired', async () => {
      const user = await createTestUser();
      const token = generateRefreshToken(user.id);

      // Insert a row with expiresAt in the past
      const row = await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${token}`])
        .send({});

      expect(res.status).toBe(401);

      const deleted = await prisma.refreshToken.findUnique({ where: { id: row.id } });
      expect(deleted).toBeNull();
    });

    it('should return 401 when the refresh token is not in the database (revoked)', async () => {
      const user = await createTestUser();
      // Token is generated but never persisted, so the DB lookup misses
      const token = generateRefreshToken(user.id);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${token}`])
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when the refresh token JWT is malformed', async () => {
      const user = await createTestUser();
      // Hand-craft a JWT signed with the wrong secret so verifyRefreshToken throws,
      // but insert a matching DB row so we exercise the verify branch (not the lookup).
      const badToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        'wrong-secret-that-does-not-match',
        { expiresIn: '7d' }
      );
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: badToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${badToken}`])
        .send({});

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 200 with no access cookie (optionalAuth)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should clear auth cookies in the response', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      const setCookieHeader = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookieHeader)
        ? setCookieHeader
        : setCookieHeader
          ? [setCookieHeader]
          : [];
      // clearCookie emits Set-Cookie entries that zero out the values
      expect(cookies.some((c: string) => c.startsWith('viraha_access=;'))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith('viraha_refresh=;'))).toBe(true);
    });

    it('should delete the refresh token row when a valid refresh cookie is sent', async () => {
      const user = await createTestUser();
      const token = await issueRefreshToken(user.id);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`viraha_refresh=${token}`])
        .send({});

      expect(res.status).toBe(200);

      const row = await prisma.refreshToken.findUnique({ where: { token } });
      expect(row).toBeNull();
    });
  });
});
