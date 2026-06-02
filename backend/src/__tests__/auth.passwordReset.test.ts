import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, prisma } from './factories';

/**
 * Password reset lifecycle:
 *   - POST /auth/forgot-password creates a PasswordReset row for a known user
 *     and supersedes any previously outstanding (unused) tokens
 *   - unknown emails still return 200 (anti-enumeration), no row created
 *   - POST /auth/reset-password with a valid token rewrites the password hash,
 *     marks the token used, and revokes outstanding refresh tokens
 *   - expired / already-used / unknown tokens are rejected with 400
 *
 * The controller stores the reset token in PLAINTEXT (password_resets.token),
 * so tests seed PasswordReset rows directly via prisma with a controlled token
 * and expiry to exercise the reset path deterministically.
 */
describe('Password reset', () => {
  const uniqueToken = (prefix: string): string =>
    `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;

  describe('POST /api/v1/auth/forgot-password', () => {
    it('creates an unused PasswordReset row for a known user', async () => {
      const user = await createTestUser();

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: user.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const rows = await prisma.passwordReset.findMany({ where: { userId: user.id } });
      expect(rows).toHaveLength(1);
      expect(rows[0].usedAt).toBeNull();
      expect(rows[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('supersedes a previously outstanding reset token', async () => {
      const user = await createTestUser();

      // Seed a prior, still-valid, unused reset token.
      const prior = await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: uniqueToken('prior'),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: user.email });

      expect(res.status).toBe(200);

      // The prior token must now be marked used (invalidated).
      const priorRow = await prisma.passwordReset.findUnique({ where: { id: prior.id } });
      expect(priorRow!.usedAt).not.toBeNull();

      // Exactly one outstanding (unused) token should remain, and it is the new one.
      const outstanding = await prisma.passwordReset.findMany({
        where: { userId: user.id, usedAt: null },
      });
      expect(outstanding).toHaveLength(1);
      expect(outstanding[0].id).not.toBe(prior.id);
    });

    it('returns 200 for an unknown email without creating a row (anti-enumeration)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: `nobody_${Date.now()}@test.com` });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const rows = await prisma.passwordReset.findMany({});
      expect(rows).toHaveLength(0);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('resets the password, marks the token used, and revokes refresh tokens', async () => {
      const user = await createTestUser();

      // Seed an active refresh token that the reset must revoke.
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: uniqueToken('refresh'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const reset = await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: uniqueToken('reset'),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const newPassword = 'brand-new-password-456';
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: reset.token, newPassword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Token is now consumed.
      const resetRow = await prisma.passwordReset.findUnique({ where: { id: reset.id } });
      expect(resetRow!.usedAt).not.toBeNull();

      // All refresh tokens for the user are revoked.
      const refreshRows = await prisma.refreshToken.findMany({ where: { userId: user.id } });
      expect(refreshRows).toHaveLength(0);

      // The new password works at login; the old factory password no longer does.
      const goodLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: newPassword });
      expect(goodLogin.status).toBe(200);
      expect(goodLogin.body.success).toBe(true);

      const staleLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'password123' });
      expect(staleLogin.status).toBe(401);
    });

    it('rejects an expired token with 400', async () => {
      const user = await createTestUser();
      const reset = await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: uniqueToken('expired'),
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: reset.token, newPassword: 'another-new-password-789' });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('INVALID_TOKEN');

      // Expired token must not be consumed and the password must be unchanged.
      const resetRow = await prisma.passwordReset.findUnique({ where: { id: reset.id } });
      expect(resetRow!.usedAt).toBeNull();

      const stillOld = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'password123' });
      expect(stillOld.status).toBe(200);
    });

    it('rejects an already-used token with 400', async () => {
      const user = await createTestUser();
      const reset = await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: uniqueToken('used'),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          usedAt: new Date(),
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: reset.token, newPassword: 'yet-another-password-000' });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('INVALID_TOKEN');
    });

    it('rejects an unknown/garbage token with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'this-token-does-not-exist', newPassword: 'whatever-password-111' });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('INVALID_TOKEN');
    });
  });
});
