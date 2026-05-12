import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

/**
 * Regression tests for the comment privacy gates introduced in commits
 * d6be1c8 (read-side) and 0eb829b (write-side). All gates must return 404
 * (not 403) to avoid leaking post existence to unauthorised viewers.
 */
describe('Comments privacy gates', () => {
  describe('GET /api/v1/posts/:postId/comments', () => {
    it('should return 404 for a private post when viewer is not the owner', async () => {
      const owner = await createTestUser();
      const viewer = await createTestUser();
      const post = await createTestPost(owner.id, { privacy: 'private' });
      const cookie = getAuthCookie(viewer.id);

      const res = await request(app)
        .get(`/api/v1/posts/${post.id}/comments`)
        .set('Cookie', cookie);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for a followers-only post when viewer is not a follower', async () => {
      const owner = await createTestUser();
      const stranger = await createTestUser();
      const post = await createTestPost(owner.id, { privacy: 'followers' });
      const cookie = getAuthCookie(stranger.id);

      const res = await request(app)
        .get(`/api/v1/posts/${post.id}/comments`)
        .set('Cookie', cookie);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 for a followers-only post when viewer is an accepted follower', async () => {
      const owner = await createTestUser();
      const follower = await createTestUser();
      const post = await createTestPost(owner.id, { privacy: 'followers' });

      await prisma.follow.create({
        data: {
          followerId: follower.id,
          followingId: owner.id,
          status: 'accepted',
        },
      });

      const cookie = getAuthCookie(follower.id);

      const res = await request(app)
        .get(`/api/v1/posts/${post.id}/comments`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should return 404 for a followers-only post when follow is pending (not accepted)', async () => {
      const owner = await createTestUser();
      const requester = await createTestUser();
      const post = await createTestPost(owner.id, { privacy: 'followers' });

      await prisma.follow.create({
        data: {
          followerId: requester.id,
          followingId: owner.id,
          status: 'pending',
        },
      });

      const cookie = getAuthCookie(requester.id);

      const res = await request(app)
        .get(`/api/v1/posts/${post.id}/comments`)
        .set('Cookie', cookie);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/posts/:postId/comments', () => {
    it('should return 404 when writing a comment on a private post as a non-owner', async () => {
      const owner = await createTestUser();
      const stranger = await createTestUser();
      const post = await createTestPost(owner.id, { privacy: 'private' });
      const cookie = getAuthCookie(stranger.id);

      const res = await request(app)
        .post(`/api/v1/posts/${post.id}/comments`)
        .set('Cookie', cookie)
        .send({ text: 'Should not be allowed' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when a non-follower tries to comment on a followers-only post', async () => {
      const owner = await createTestUser();
      const stranger = await createTestUser();
      const post = await createTestPost(owner.id, { privacy: 'followers' });
      const cookie = getAuthCookie(stranger.id);

      const res = await request(app)
        .post(`/api/v1/posts/${post.id}/comments`)
        .set('Cookie', cookie)
        .send({ text: 'Should not be allowed' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 201 when an accepted follower comments on a followers-only post', async () => {
      const owner = await createTestUser();
      const follower = await createTestUser();
      const post = await createTestPost(owner.id, { privacy: 'followers' });

      await prisma.follow.create({
        data: {
          followerId: follower.id,
          followingId: owner.id,
          status: 'accepted',
        },
      });

      const cookie = getAuthCookie(follower.id);

      const res = await request(app)
        .post(`/api/v1/posts/${post.id}/comments`)
        .set('Cookie', cookie)
        .send({ text: 'Great post!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.text).toBe('Great post!');
    });

    it('should return 404 when a pending follower tries to comment on a followers-only post', async () => {
      const owner = await createTestUser();
      const requester = await createTestUser();
      const post = await createTestPost(owner.id, { privacy: 'followers' });

      await prisma.follow.create({
        data: {
          followerId: requester.id,
          followingId: owner.id,
          status: 'pending',
        },
      });

      const cookie = getAuthCookie(requester.id);

      const res = await request(app)
        .post(`/api/v1/posts/${post.id}/comments`)
        .set('Cookie', cookie)
        .send({ text: 'Should not be allowed yet' });

      expect(res.status).toBe(404);
    });

    it('should allow the post owner to comment on their own private post', async () => {
      const owner = await createTestUser();
      const post = await createTestPost(owner.id, { privacy: 'private' });
      const cookie = getAuthCookie(owner.id);

      const res = await request(app)
        .post(`/api/v1/posts/${post.id}/comments`)
        .set('Cookie', cookie)
        .send({ text: 'Note to self' });

      expect(res.status).toBe(201);
      expect(res.body.data.comment.text).toBe('Note to self');
    });
  });
});
