import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, getAuthCookie, prisma } from './factories';

const HOUR = 60 * 60 * 1000;

function futureIso(msAhead = 24 * HOUR): string {
  return new Date(Date.now() + msAhead).toISOString();
}

function pastIso(msAgo = 24 * HOUR): string {
  return new Date(Date.now() - msAgo).toISOString();
}

describe('Time Capsules API', () => {
  describe('POST /api/v1/time-capsules', () => {
    it('should create a time capsule with a future openAt', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);
      const openAt = futureIso();

      const res = await request(app)
        .post('/api/v1/time-capsules')
        .set('Cookie', cookie)
        .send({
          content: 'A letter to my future self before departure.',
          type: 'letter_to_self',
          locationName: 'Lisbon',
          locationLat: 38.7223,
          locationLng: -9.1393,
          openAt,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(user.id);
      expect(res.body.data.content).toBe('A letter to my future self before departure.');
      expect(res.body.data.type).toBe('letter_to_self');
      expect(res.body.data.isOpened).toBe(false);
      expect(new Date(res.body.data.openAt).getTime()).toBe(new Date(openAt).getTime());
    });

    it('should default type to departure when omitted', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post('/api/v1/time-capsules')
        .set('Cookie', cookie)
        .send({ content: 'See you on the other side.', openAt: futureIso() });

      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe('departure');
    });

    it('should reject a past openAt with 400', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post('/api/v1/time-capsules')
        .set('Cookie', cookie)
        .send({ content: 'Should not be stored.', openAt: pastIso() });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('should reject empty content with 400', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post('/api/v1/time-capsules')
        .set('Cookie', cookie)
        .send({ content: '', openAt: futureIso() });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should require auth', async () => {
      const res = await request(app)
        .post('/api/v1/time-capsules')
        .send({ content: 'No auth here.', openAt: futureIso() });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/time-capsules/:id/open', () => {
    it('should block opening a capsule before its openAt with 403', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      // A sealed capsule unlocking in the future cannot be created+opened via the API
      // in one flow within the lock window, so insert directly with a future openAt.
      const capsule = await prisma.timeCapsule.create({
        data: {
          userId: user.id,
          content: 'Still sealed.',
          type: 'departure',
          openAt: new Date(Date.now() + 7 * 24 * HOUR),
        },
      });

      const res = await request(app)
        .post(`/api/v1/time-capsules/${capsule.id}/open`)
        .set('Cookie', cookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Capsule must remain unopened.
      const stored = await prisma.timeCapsule.findUnique({ where: { id: capsule.id } });
      expect(stored?.isOpened).toBe(false);
      expect(stored?.openedAt).toBeNull();
    });

    it('should open a capsule once its openAt has passed', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      // Past openAt can only exist via a direct insert (the create validator forbids it).
      const capsule = await prisma.timeCapsule.create({
        data: {
          userId: user.id,
          content: 'Time to read this.',
          type: 'letter_to_self',
          openAt: new Date(Date.now() - 1 * HOUR),
        },
      });

      const res = await request(app)
        .post(`/api/v1/time-capsules/${capsule.id}/open`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(capsule.id);
      expect(res.body.data.isOpened).toBe(true);
      expect(res.body.data.openedAt).not.toBeNull();

      const stored = await prisma.timeCapsule.findUnique({ where: { id: capsule.id } });
      expect(stored?.isOpened).toBe(true);
      expect(stored?.openedAt).not.toBeNull();
    });

    it('should not let a different user open someone else capsule', async () => {
      const owner = await createTestUser();
      const other = await createTestUser();
      const otherCookie = getAuthCookie(other.id);

      const capsule = await prisma.timeCapsule.create({
        data: {
          userId: owner.id,
          content: 'Private to the owner.',
          type: 'departure',
          openAt: new Date(Date.now() - 1 * HOUR),
        },
      });

      const res = await request(app)
        .post(`/api/v1/time-capsules/${capsule.id}/open`)
        .set('Cookie', otherCookie);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // The owner's capsule must stay sealed despite the unlocked openAt.
      const stored = await prisma.timeCapsule.findUnique({ where: { id: capsule.id } });
      expect(stored?.isOpened).toBe(false);
    });

    it('should return 404 for a nonexistent capsule', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post('/api/v1/time-capsules/00000000-0000-0000-0000-000000000000/open')
        .set('Cookie', cookie);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should require auth to open', async () => {
      const user = await createTestUser();
      const capsule = await prisma.timeCapsule.create({
        data: {
          userId: user.id,
          content: 'Needs auth.',
          type: 'departure',
          openAt: new Date(Date.now() - 1 * HOUR),
        },
      });

      const res = await request(app).post(`/api/v1/time-capsules/${capsule.id}/open`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/time-capsules', () => {
    it('should hide sealed capsules by default and reveal them with includeSealed', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const sealed = await prisma.timeCapsule.create({
        data: {
          userId: user.id,
          content: 'Locked for now.',
          type: 'departure',
          openAt: new Date(Date.now() + 7 * 24 * HOUR),
        },
      });
      const openable = await prisma.timeCapsule.create({
        data: {
          userId: user.id,
          content: 'Ready to open.',
          type: 'departure',
          openAt: new Date(Date.now() - 1 * HOUR),
        },
      });

      const hiddenRes = await request(app)
        .get('/api/v1/time-capsules')
        .set('Cookie', cookie);

      expect(hiddenRes.status).toBe(200);
      expect(hiddenRes.body.success).toBe(true);
      const hiddenIds = hiddenRes.body.data.map((c: { id: string }) => c.id);
      expect(hiddenIds).toContain(openable.id);
      expect(hiddenIds).not.toContain(sealed.id);

      const allRes = await request(app)
        .get('/api/v1/time-capsules?includeSealed=true')
        .set('Cookie', cookie);

      expect(allRes.status).toBe(200);
      const allIds = allRes.body.data.map((c: { id: string }) => c.id);
      expect(allIds).toContain(openable.id);
      expect(allIds).toContain(sealed.id);
    });

    it('should not list another user capsules', async () => {
      const owner = await createTestUser();
      const other = await createTestUser();
      const otherCookie = getAuthCookie(other.id);

      const capsule = await prisma.timeCapsule.create({
        data: {
          userId: owner.id,
          content: 'Belongs to owner.',
          type: 'departure',
          openAt: new Date(Date.now() - 1 * HOUR),
        },
      });

      const res = await request(app)
        .get('/api/v1/time-capsules?includeSealed=true')
        .set('Cookie', otherCookie);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((c: { id: string }) => c.id);
      expect(ids).not.toContain(capsule.id);
    });

    it('should require auth to list', async () => {
      const res = await request(app).get('/api/v1/time-capsules');
      expect(res.status).toBe(401);
    });
  });
});
