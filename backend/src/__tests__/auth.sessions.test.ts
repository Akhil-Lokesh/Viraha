import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, getAuthCookie, prisma } from './factories';
import { generateRefreshToken } from '../utils/jwt';

interface SessionDto {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

function getRefreshCookieValue(res: request.Response): string {
  const header = res.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header : header ? [header] : [];
  const cookie = cookies.find((c: string) => c.startsWith('viraha_refresh='));
  if (!cookie) throw new Error('No viraha_refresh cookie in response');
  const value = cookie.split(';')[0].split('=').slice(1).join('=');
  if (!value) throw new Error('Empty viraha_refresh cookie in response');
  return value;
}

async function loginFromDevice(email: string, userAgent: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('User-Agent', userAgent)
    .send({ email, password: 'password123' });
  expect(res.status).toBe(200);
  return getRefreshCookieValue(res);
}

async function listSessions(userId: string, refreshToken?: string): Promise<SessionDto[]> {
  const cookies = [getAuthCookie(userId)];
  if (refreshToken) cookies.push(`viraha_refresh=${refreshToken}`);
  const res = await request(app).get('/api/v1/auth/sessions').set('Cookie', cookies);
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  return res.body.data.sessions as SessionDto[];
}

describe('Auth session management', () => {
  describe('GET /api/v1/auth/sessions', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/v1/auth/sessions');
      expect(res.status).toBe(401);
    });

    it('should list sessions from two devices with metadata and mark the current one', async () => {
      const user = await createTestUser();
      const tokenA = await loginFromDevice(user.email, 'Device-A/1.0');
      const tokenB = await loginFromDevice(user.email, 'Device-B/2.0');

      // Request authenticated as the user, presenting device B's refresh cookie
      const sessions = await listSessions(user.id, tokenB);

      expect(sessions).toHaveLength(2);

      const sessionA = sessions.find((s) => s.userAgent === 'Device-A/1.0');
      const sessionB = sessions.find((s) => s.userAgent === 'Device-B/2.0');
      expect(sessionA).toBeDefined();
      expect(sessionB).toBeDefined();

      // Metadata is stored
      expect(sessionA!.ip).toBeTruthy();
      expect(sessionB!.ip).toBeTruthy();
      expect(sessionA!.createdAt).toBeTruthy();
      expect(sessionA!.lastUsedAt).toBeTruthy();

      // `current` reflects the refresh cookie presented in this request
      expect(sessionB!.current).toBe(true);
      expect(sessionA!.current).toBe(false);

      // Raw token values are never exposed
      expect(sessionA).not.toHaveProperty('token');
      expect(sessions.some((s) => JSON.stringify(s).includes(tokenA))).toBe(false);
    });

    it('should order sessions newest first', async () => {
      const user = await createTestUser();
      const now = Date.now();
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: generateRefreshToken(user.id),
          expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(now - 60 * 60 * 1000),
          userAgent: 'Older-Device',
        },
      });
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: generateRefreshToken(user.id),
          expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(now),
          userAgent: 'Newer-Device',
        },
      });

      const sessions = await listSessions(user.id);
      expect(sessions.map((s) => s.userAgent)).toEqual(['Newer-Device', 'Older-Device']);
    });

    it('should exclude expired sessions', async () => {
      const user = await createTestUser();
      const activeToken = await loginFromDevice(user.email, 'Active-Device/1.0');
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: generateRefreshToken(user.id),
          expiresAt: new Date(Date.now() - 1000),
          userAgent: 'Expired-Device/1.0',
        },
      });

      const sessions = await listSessions(user.id, activeToken);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].userAgent).toBe('Active-Device/1.0');
    });

    it('should not include another user sessions', async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();
      await loginFromDevice(userA.email, 'A-Device/1.0');
      await loginFromDevice(userB.email, 'B-Device/1.0');

      const sessions = await listSessions(userA.id);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].userAgent).toBe('A-Device/1.0');
    });
  });

  describe('DELETE /api/v1/auth/sessions/:id', () => {
    it('should revoke another of my sessions and invalidate its refresh token', async () => {
      const user = await createTestUser();
      const tokenA = await loginFromDevice(user.email, 'Device-A/1.0');
      const tokenB = await loginFromDevice(user.email, 'Device-B/2.0');

      const rowA = await prisma.refreshToken.findUnique({ where: { token: tokenA } });
      expect(rowA).not.toBeNull();

      const res = await request(app)
        .delete(`/api/v1/auth/sessions/${rowA!.id}`)
        .set('Cookie', [getAuthCookie(user.id), `viraha_refresh=${tokenB}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Revoked device's refresh token no longer works
      const refreshA = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${tokenA}`])
        .send({});
      expect(refreshA.status).toBe(401);

      // Surviving device's refresh token still works
      const refreshB = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${tokenB}`])
        .send({});
      expect(refreshB.status).toBe(200);
    });

    it('should allow revoking the current session (logout of this device)', async () => {
      const user = await createTestUser();
      const token = await loginFromDevice(user.email, 'Device-A/1.0');
      const row = await prisma.refreshToken.findUnique({ where: { token } });

      const res = await request(app)
        .delete(`/api/v1/auth/sessions/${row!.id}`)
        .set('Cookie', [getAuthCookie(user.id), `viraha_refresh=${token}`]);

      expect(res.status).toBe(200);

      const refresh = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${token}`])
        .send({});
      expect(refresh.status).toBe(401);
    });

    it('should return 404 when revoking another user session', async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();
      const tokenA = await loginFromDevice(userA.email, 'A-Device/1.0');
      const rowA = await prisma.refreshToken.findUnique({ where: { token: tokenA } });

      const res = await request(app)
        .delete(`/api/v1/auth/sessions/${rowA!.id}`)
        .set('Cookie', [getAuthCookie(userB.id)]);

      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('NOT_FOUND');

      // User A's session is untouched and still refreshable
      const stillThere = await prisma.refreshToken.findUnique({ where: { id: rowA!.id } });
      expect(stillThere).not.toBeNull();
      const refreshA = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${tokenA}`])
        .send({});
      expect(refreshA.status).toBe(200);
    });

    it('should return 404 for an unknown or malformed session id', async () => {
      const user = await createTestUser();
      const cookie = [getAuthCookie(user.id)];

      const unknown = await request(app)
        .delete('/api/v1/auth/sessions/00000000-0000-4000-8000-000000000000')
        .set('Cookie', cookie);
      expect(unknown.status).toBe(404);

      const malformed = await request(app)
        .delete('/api/v1/auth/sessions/not-a-uuid')
        .set('Cookie', cookie);
      expect(malformed.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/auth/sessions (revoke all others)', () => {
    it('should revoke every session except the current one', async () => {
      const user = await createTestUser();
      const tokenA = await loginFromDevice(user.email, 'Device-A/1.0');
      const tokenB = await loginFromDevice(user.email, 'Device-B/2.0');
      const tokenC = await loginFromDevice(user.email, 'Device-C/3.0');

      const res = await request(app)
        .delete('/api/v1/auth/sessions')
        .set('Cookie', [getAuthCookie(user.id), `viraha_refresh=${tokenC}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.revoked).toBe(2);

      // Other devices' refresh tokens stop working
      for (const revoked of [tokenA, tokenB]) {
        const refresh = await request(app)
          .post('/api/v1/auth/refresh')
          .set('Cookie', [`viraha_refresh=${revoked}`])
          .send({});
        expect(refresh.status).toBe(401);
      }

      // Current device keeps working
      const refreshC = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${tokenC}`])
        .send({});
      expect(refreshC.status).toBe(200);
    });

    it('should not touch another user sessions', async () => {
      const userA = await createTestUser();
      const userB = await createTestUser();
      await loginFromDevice(userA.email, 'A-Device/1.0');
      const tokenB = await loginFromDevice(userB.email, 'B-Device/1.0');

      const res = await request(app)
        .delete('/api/v1/auth/sessions')
        .set('Cookie', [getAuthCookie(userA.id)]);

      expect(res.status).toBe(200);

      // User B's session survives
      const refreshB = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`viraha_refresh=${tokenB}`])
        .send({});
      expect(refreshB.status).toBe(200);
    });
  });

  describe('refresh rotation carries session metadata', () => {
    it('should store userAgent and ip on the rotated token row', async () => {
      const user = await createTestUser();
      const token = await loginFromDevice(user.email, 'Device-A/1.0');

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('User-Agent', 'Device-A/1.1')
        .set('Cookie', [`viraha_refresh=${token}`])
        .send({});
      expect(res.status).toBe(200);

      const newToken = getRefreshCookieValue(res);
      const row = await prisma.refreshToken.findUnique({ where: { token: newToken } });
      expect(row).not.toBeNull();
      expect(row!.userAgent).toBe('Device-A/1.1');
      expect(row!.ip).toBeTruthy();
      expect(row!.lastUsedAt).toBeInstanceOf(Date);
    });
  });
});
