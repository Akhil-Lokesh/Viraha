import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

describe('Data Export & Account Deletion API', () => {
  describe('POST /api/v1/users/me/export', () => {
    it('should export the authenticated user data without passwordHash', async () => {
      const user = await createTestUser();
      await createTestPost(user.id, { caption: 'Exportable post' });
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post('/api/v1/users/me/export')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      // Controller responds with the raw export object (no success envelope).
      expect(res.body.exportedAt).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(user.username);
      expect(res.body.user.email).toBe(user.email);

      // The user's own posts are included in the dump.
      expect(Array.isArray(res.body.posts)).toBe(true);
      const captions = res.body.posts.map((p: { caption: string | null }) => p.caption);
      expect(captions).toContain('Exportable post');

      // Sensitive credential material must never be present anywhere in the export.
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.passwordHash).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });

    it('should require auth (401 without cookie)', async () => {
      const res = await request(app).post('/api/v1/users/me/export');

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/users/me', () => {
    it('should delete the account with the correct confirmUsername and clear cookies', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .delete('/api/v1/users/me')
        .set('Cookie', cookie)
        .send({ confirmUsername: user.username });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Account deleted');

      // The user row is actually gone.
      const deleted = await prisma.user.findUnique({ where: { id: user.id } });
      expect(deleted).toBeNull();

      // Auth cookies are cleared (Set-Cookie expiring the access/refresh cookies).
      const setCookie = res.headers['set-cookie'];
      const cookieHeader = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie ?? '');
      expect(cookieHeader).toContain('viraha_access');
      expect(cookieHeader).toContain('viraha_refresh');
    });

    it('should reject deletion with a wrong confirmUsername (400) and keep the user', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .delete('/api/v1/users/me')
        .set('Cookie', cookie)
        .send({ confirmUsername: 'definitely-not-the-username' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      // The user must still exist after a failed confirmation.
      const stillThere = await prisma.user.findUnique({ where: { id: user.id } });
      expect(stillThere).not.toBeNull();
      expect(stillThere?.id).toBe(user.id);
    });

    it('should require auth (401 without cookie)', async () => {
      const res = await request(app)
        .delete('/api/v1/users/me')
        .send({ confirmUsername: 'anything' });

      expect(res.status).toBe(401);
    });
  });
});
