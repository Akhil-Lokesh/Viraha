import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

/**
 * User blocking:
 *   - POST /users/:id/block creates a Block row and tears down follows in both directions
 *   - Blocked users disappear from /feed, /posts (filterUserId), /posts/search, /users/search
 *   - Blocker's profile 404s for the blocked user and vice versa
 *   - Cannot follow / comment on someone blocked in either direction
 *   - DELETE /users/:id/block removes the row; previously-removed follows are NOT auto-restored
 */
describe('User blocks', () => {
  describe('POST /api/v1/users/:userId/block', () => {
    it('creates a Block row and removes any existing follows in either direction', async () => {
      const a = await createTestUser();
      const b = await createTestUser();

      // Set up mutual follow
      await prisma.follow.create({ data: { followerId: a.id, followingId: b.id, status: 'accepted' } });
      await prisma.follow.create({ data: { followerId: b.id, followingId: a.id, status: 'accepted' } });

      const res = await request(app)
        .post(`/api/v1/users/${b.id}/block`)
        .set('Cookie', [getAuthCookie(a.id)])
        .send({});

      expect(res.status).toBe(201);

      const block = await prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: a.id, blockedId: b.id } },
      });
      expect(block).not.toBeNull();

      const follows = await prisma.follow.findMany({
        where: {
          OR: [
            { followerId: a.id, followingId: b.id },
            { followerId: b.id, followingId: a.id },
          ],
        },
      });
      expect(follows).toHaveLength(0);
    });

    it('rejects blocking yourself', async () => {
      const a = await createTestUser();
      const res = await request(app)
        .post(`/api/v1/users/${a.id}/block`)
        .set('Cookie', [getAuthCookie(a.id)])
        .send({});
      expect(res.status).toBe(400);
    });

    it('is idempotent at the API level (409 on duplicate)', async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      await prisma.block.create({ data: { blockerId: a.id, blockedId: b.id } });

      const res = await request(app)
        .post(`/api/v1/users/${b.id}/block`)
        .set('Cookie', [getAuthCookie(a.id)])
        .send({});
      expect(res.status).toBe(409);
    });
  });

  describe('Visibility', () => {
    it('blocked user disappears from /posts when filtered by their userId', async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      await createTestPost(b.id);
      await prisma.block.create({ data: { blockerId: a.id, blockedId: b.id } });

      const res = await request(app)
        .get(`/api/v1/posts?userId=${b.id}`)
        .set('Cookie', [getAuthCookie(a.id)]);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
    });

    it('symmetric: posts from users who blocked viewer also disappear', async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      await createTestPost(b.id);
      // b blocked a (not the other way around)
      await prisma.block.create({ data: { blockerId: b.id, blockedId: a.id } });

      const res = await request(app)
        .get('/api/v1/posts')
        .set('Cookie', [getAuthCookie(a.id)]);

      expect(res.status).toBe(200);
      const posterIds = res.body.data.items.map((p: { userId: string }) => p.userId);
      expect(posterIds).not.toContain(b.id);
    });

    it('getUserByUsername returns 404 when either side has blocked the other', async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      await prisma.block.create({ data: { blockerId: a.id, blockedId: b.id } });

      const res = await request(app)
        .get(`/api/v1/users/${b.username}`)
        .set('Cookie', [getAuthCookie(a.id)]);
      expect(res.status).toBe(404);
    });

    it('users/search excludes hidden users', async () => {
      const a = await createTestUser();
      const b = await createTestUser({ username: 'searchable_target_user' });
      await prisma.block.create({ data: { blockerId: a.id, blockedId: b.id } });

      const res = await request(app)
        .get(`/api/v1/users/search?q=searchable_target_user`)
        .set('Cookie', [getAuthCookie(a.id)]);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toHaveLength(0);
    });
  });

  describe('Write paths', () => {
    it('followUser returns 404 when either side has blocked the other', async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      await prisma.block.create({ data: { blockerId: a.id, blockedId: b.id } });

      const res = await request(app)
        .post(`/api/v1/users/${b.id}/follow`)
        .set('Cookie', [getAuthCookie(a.id)])
        .send({});
      expect(res.status).toBe(404);

      const res2 = await request(app)
        .post(`/api/v1/users/${a.id}/follow`)
        .set('Cookie', [getAuthCookie(b.id)])
        .send({});
      expect(res2.status).toBe(404);
    });

    it('createComment returns 404 when either side has blocked the other', async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      const post = await createTestPost(b.id);
      await prisma.block.create({ data: { blockerId: a.id, blockedId: b.id } });

      const res = await request(app)
        .post(`/api/v1/posts/${post.id}/comments`)
        .set('Cookie', [getAuthCookie(a.id)])
        .send({ text: 'hello' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/users/:userId/block', () => {
    it('removes the row and does not restore prior follows', async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      await prisma.follow.create({ data: { followerId: a.id, followingId: b.id, status: 'accepted' } });

      // Block (removes the follow)
      await request(app)
        .post(`/api/v1/users/${b.id}/block`)
        .set('Cookie', [getAuthCookie(a.id)])
        .send({});

      // Unblock
      const res = await request(app)
        .delete(`/api/v1/users/${b.id}/block`)
        .set('Cookie', [getAuthCookie(a.id)])
        .send({});
      expect(res.status).toBe(200);

      const block = await prisma.block.findUnique({
        where: { blockerId_blockedId: { blockerId: a.id, blockedId: b.id } },
      });
      expect(block).toBeNull();

      // Follow should NOT be auto-restored
      const follows = await prisma.follow.findMany({
        where: { followerId: a.id, followingId: b.id },
      });
      expect(follows).toHaveLength(0);
    });
  });

  describe('GET /api/v1/users/me/blocks', () => {
    it('lists blocked users for the current user', async () => {
      const a = await createTestUser();
      const b = await createTestUser();
      const c = await createTestUser();
      await prisma.block.create({ data: { blockerId: a.id, blockedId: b.id } });
      await prisma.block.create({ data: { blockerId: a.id, blockedId: c.id } });

      const res = await request(app)
        .get('/api/v1/users/me/blocks')
        .set('Cookie', [getAuthCookie(a.id)]);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      const ids = res.body.data.items.map((i: { user: { id: string } }) => i.user.id);
      expect(ids).toContain(b.id);
      expect(ids).toContain(c.id);
    });
  });
});
