import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, getAuthCookie, prisma } from './factories';

/**
 * Email verification flow:
 *   - register creates a pending EmailVerification row
 *   - POST /auth/verify-email flips emailVerified and marks the token used
 *   - expired / used tokens are rejected
 *   - resend invalidates older outstanding tokens
 */
describe('Email verification', () => {
  describe('POST /api/v1/auth/register', () => {
    it('creates an unused EmailVerification row', async () => {
      const id = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const email = `verify_${id}@test.com`;

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: `verify_${id}`,
          email,
          password: 'password123',
        });

      expect(res.status).toBe(201);
      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).not.toBeNull();
      expect(user!.emailVerified).toBe(false);

      const tokens = await prisma.emailVerification.findMany({ where: { userId: user!.id } });
      expect(tokens).toHaveLength(1);
      expect(tokens[0].usedAt).toBeNull();
      expect(tokens[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    it('flips emailVerified and marks the token used', async () => {
      const user = await createTestUser();
      const record = await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: `tok_${user.id}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: record.token });

      expect(res.status).toBe(200);

      const after = await prisma.user.findUnique({ where: { id: user.id } });
      expect(after!.emailVerified).toBe(true);

      const tokenRow = await prisma.emailVerification.findUnique({ where: { id: record.id } });
      expect(tokenRow!.usedAt).not.toBeNull();
    });

    it('rejects an expired token', async () => {
      const user = await createTestUser();
      const record = await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: `tok_${user.id}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: record.token });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('INVALID_TOKEN');

      const after = await prisma.user.findUnique({ where: { id: user.id } });
      expect(after!.emailVerified).toBe(false);
    });

    it('rejects an already-used token', async () => {
      const user = await createTestUser();
      const record = await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: `tok_${user.id}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          usedAt: new Date(),
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: record.token });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('INVALID_TOKEN');
    });

    it('rejects an unknown token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: '0'.repeat(64) });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/resend-verification', () => {
    it('invalidates older outstanding tokens and creates a fresh one', async () => {
      const user = await createTestUser();
      const old = await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: `old_${user.id}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .set('Cookie', [getAuthCookie(user.id)])
        .send({});

      expect(res.status).toBe(200);

      const oldRow = await prisma.emailVerification.findUnique({ where: { id: old.id } });
      expect(oldRow!.usedAt).not.toBeNull();

      const fresh = await prisma.emailVerification.findMany({
        where: { userId: user.id, usedAt: null },
      });
      expect(fresh).toHaveLength(1);
      expect(fresh[0].id).not.toBe(old.id);
    });

    it('is a no-op when the user is already verified', async () => {
      const user = await createTestUser({ emailVerified: true });

      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .set('Cookie', [getAuthCookie(user.id)])
        .send({});

      expect(res.status).toBe(200);

      const tokens = await prisma.emailVerification.findMany({ where: { userId: user.id } });
      expect(tokens).toHaveLength(0);
    });

    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .send({});

      expect(res.status).toBe(401);
    });
  });
});
