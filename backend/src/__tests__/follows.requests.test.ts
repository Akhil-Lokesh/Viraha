import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, getAuthCookie, prisma } from './factories';

describe('Follow Requests (private accounts)', () => {
  describe('POST /api/v1/users/:userId/follow (private target)', () => {
    it('creates a pending follow when target is private', async () => {
      const requester = await createTestUser();
      const target = await createTestUser({ isPrivate: true });
      const cookie = getAuthCookie(requester.id);

      const res = await request(app)
        .post(`/api/v1/users/${target.id}/follow`)
        .set('Cookie', cookie);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.follow.status).toBe('pending');

      const row = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: requester.id,
            followingId: target.id,
          },
        },
      });
      expect(row).not.toBeNull();
      expect(row?.status).toBe('pending');
    });

    it('does not surface a pending follower in the target followers list', async () => {
      const requester = await createTestUser();
      const target = await createTestUser({ isPrivate: true });
      const cookie = getAuthCookie(requester.id);

      await request(app)
        .post(`/api/v1/users/${target.id}/follow`)
        .set('Cookie', cookie);

      const res = await request(app).get(`/api/v1/users/${target.id}/followers`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });

  describe('POST /api/v1/users/follow-requests/:followId/accept', () => {
    it('flips a pending request to accepted for the target user', async () => {
      const requester = await createTestUser();
      const target = await createTestUser({ isPrivate: true });

      const follow = await prisma.follow.create({
        data: {
          followerId: requester.id,
          followingId: target.id,
          status: 'pending',
        },
      });

      const targetCookie = getAuthCookie(target.id);

      const res = await request(app)
        .post(`/api/v1/users/follow-requests/${follow.id}/accept`)
        .set('Cookie', targetCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBeDefined();

      const updated = await prisma.follow.findUnique({ where: { id: follow.id } });
      expect(updated?.status).toBe('accepted');
    });

    it('lets the requester appear in followers once accepted', async () => {
      const requester = await createTestUser();
      const target = await createTestUser({ isPrivate: true });

      const follow = await prisma.follow.create({
        data: {
          followerId: requester.id,
          followingId: target.id,
          status: 'pending',
        },
      });

      await request(app)
        .post(`/api/v1/users/follow-requests/${follow.id}/accept`)
        .set('Cookie', getAuthCookie(target.id));

      const res = await request(app).get(`/api/v1/users/${target.id}/followers`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].id).toBe(requester.id);
    });

    it('returns 404 when a non-target user tries to accept the request', async () => {
      const requester = await createTestUser();
      const target = await createTestUser({ isPrivate: true });
      const stranger = await createTestUser();

      const follow = await prisma.follow.create({
        data: {
          followerId: requester.id,
          followingId: target.id,
          status: 'pending',
        },
      });

      const res = await request(app)
        .post(`/api/v1/users/follow-requests/${follow.id}/accept`)
        .set('Cookie', getAuthCookie(stranger.id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // The pending row must be left untouched.
      const untouched = await prisma.follow.findUnique({ where: { id: follow.id } });
      expect(untouched?.status).toBe('pending');
    });

    it('returns 401 when unauthenticated', async () => {
      const requester = await createTestUser();
      const target = await createTestUser({ isPrivate: true });

      const follow = await prisma.follow.create({
        data: {
          followerId: requester.id,
          followingId: target.id,
          status: 'pending',
        },
      });

      const res = await request(app).post(
        `/api/v1/users/follow-requests/${follow.id}/accept`
      );

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/users/follow-requests/:followId/reject', () => {
    it('deletes the pending follow row', async () => {
      const requester = await createTestUser();
      const target = await createTestUser({ isPrivate: true });

      const follow = await prisma.follow.create({
        data: {
          followerId: requester.id,
          followingId: target.id,
          status: 'pending',
        },
      });

      const res = await request(app)
        .post(`/api/v1/users/follow-requests/${follow.id}/reject`)
        .set('Cookie', getAuthCookie(target.id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBeDefined();

      const deleted = await prisma.follow.findUnique({ where: { id: follow.id } });
      expect(deleted).toBeNull();
    });

    it('returns 404 when a non-target user tries to reject the request', async () => {
      const requester = await createTestUser();
      const target = await createTestUser({ isPrivate: true });
      const stranger = await createTestUser();

      const follow = await prisma.follow.create({
        data: {
          followerId: requester.id,
          followingId: target.id,
          status: 'pending',
        },
      });

      const res = await request(app)
        .post(`/api/v1/users/follow-requests/${follow.id}/reject`)
        .set('Cookie', getAuthCookie(stranger.id));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // The row must still exist because the rejection was not authorized.
      const stillThere = await prisma.follow.findUnique({ where: { id: follow.id } });
      expect(stillThere).not.toBeNull();
      expect(stillThere?.status).toBe('pending');
    });

    it('returns 404 for an already-accepted follow (not a pending request)', async () => {
      const requester = await createTestUser();
      const target = await createTestUser({ isPrivate: true });

      const follow = await prisma.follow.create({
        data: {
          followerId: requester.id,
          followingId: target.id,
          status: 'accepted',
        },
      });

      const res = await request(app)
        .post(`/api/v1/users/follow-requests/${follow.id}/reject`)
        .set('Cookie', getAuthCookie(target.id));

      expect(res.status).toBe(404);

      const stillThere = await prisma.follow.findUnique({ where: { id: follow.id } });
      expect(stillThere).not.toBeNull();
    });
  });

  describe('GET /api/v1/users/me/follow-requests', () => {
    it('lists pending follow requests for the authenticated target', async () => {
      const requesterA = await createTestUser();
      const requesterB = await createTestUser();
      const target = await createTestUser({ isPrivate: true });

      const followA = await prisma.follow.create({
        data: {
          followerId: requesterA.id,
          followingId: target.id,
          status: 'pending',
        },
      });
      await prisma.follow.create({
        data: {
          followerId: requesterB.id,
          followingId: target.id,
          status: 'pending',
        },
      });

      const res = await request(app)
        .get('/api/v1/users/me/follow-requests')
        .set('Cookie', getAuthCookie(target.id));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(2);

      const ids = res.body.data.items.map((item: { id: string }) => item.id);
      expect(ids).toContain(requesterA.id);
      expect(ids).toContain(requesterB.id);

      // Each item carries the followId needed to accept/reject it.
      const itemA = res.body.data.items.find(
        (item: { id: string }) => item.id === requesterA.id
      );
      expect(itemA.followId).toBe(followA.id);
    });

    it('excludes accepted follows from the pending list', async () => {
      const accepted = await createTestUser();
      const pending = await createTestUser();
      const target = await createTestUser({ isPrivate: true });

      await prisma.follow.create({
        data: {
          followerId: accepted.id,
          followingId: target.id,
          status: 'accepted',
        },
      });
      await prisma.follow.create({
        data: {
          followerId: pending.id,
          followingId: target.id,
          status: 'pending',
        },
      });

      const res = await request(app)
        .get('/api/v1/users/me/follow-requests')
        .set('Cookie', getAuthCookie(target.id));

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].id).toBe(pending.id);
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/users/me/follow-requests');

      expect(res.status).toBe(401);
    });
  });
});
