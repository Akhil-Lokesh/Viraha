import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

describe('Saves API', () => {
  describe('POST /api/v1/posts/:postId/save', () => {
    it('should save a post, create a Save row, and increment saveCount', async () => {
      const owner = await createTestUser();
      const saver = await createTestUser();
      const post = await createTestPost(owner.id);
      const cookie = getAuthCookie(saver.id);

      const res = await request(app)
        .post(`/api/v1/posts/${post.id}/save`)
        .set('Cookie', cookie);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.saved).toBe(true);
      expect(res.body.data.saveCount).toBe(1);

      const saveRow = await prisma.save.findUnique({
        where: { userId_postId: { userId: saver.id, postId: post.id } },
      });
      expect(saveRow).not.toBeNull();

      const updatedPost = await prisma.post.findUnique({
        where: { id: post.id },
        select: { saveCount: true },
      });
      expect(updatedPost?.saveCount).toBe(1);
    });

    it('should toggle off on a second call, remove the Save row, and decrement saveCount', async () => {
      const owner = await createTestUser();
      const saver = await createTestUser();
      const post = await createTestPost(owner.id);
      const cookie = getAuthCookie(saver.id);

      const first = await request(app)
        .post(`/api/v1/posts/${post.id}/save`)
        .set('Cookie', cookie);
      expect(first.status).toBe(201);
      expect(first.body.data.saved).toBe(true);
      expect(first.body.data.saveCount).toBe(1);

      const second = await request(app)
        .post(`/api/v1/posts/${post.id}/save`)
        .set('Cookie', cookie);

      expect(second.status).toBe(200);
      expect(second.body.success).toBe(true);
      expect(second.body.data.saved).toBe(false);
      expect(second.body.data.saveCount).toBe(0);

      const saveRow = await prisma.save.findUnique({
        where: { userId_postId: { userId: saver.id, postId: post.id } },
      });
      expect(saveRow).toBeNull();

      const updatedPost = await prisma.post.findUnique({
        where: { id: post.id },
        select: { saveCount: true },
      });
      expect(updatedPost?.saveCount).toBe(0);
    });

    it('should require auth', async () => {
      const owner = await createTestUser();
      const post = await createTestPost(owner.id);

      const res = await request(app).post(`/api/v1/posts/${post.id}/save`);

      expect(res.status).toBe(401);
    });

    it('should return 404 when saving a non-existent post', async () => {
      const saver = await createTestUser();
      const cookie = getAuthCookie(saver.id);

      const res = await request(app)
        .post('/api/v1/posts/00000000-0000-0000-0000-000000000000/save')
        .set('Cookie', cookie);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when saving a soft-deleted post', async () => {
      const owner = await createTestUser();
      const saver = await createTestUser();
      const post = await createTestPost(owner.id, { isDeleted: true });
      const cookie = getAuthCookie(saver.id);

      const res = await request(app)
        .post(`/api/v1/posts/${post.id}/save`)
        .set('Cookie', cookie);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      const saveRow = await prisma.save.findUnique({
        where: { userId_postId: { userId: saver.id, postId: post.id } },
      });
      expect(saveRow).toBeNull();
    });
  });

  describe('GET /api/v1/posts/:postId/save', () => {
    it('should return saved=false when the post is not saved', async () => {
      const owner = await createTestUser();
      const viewer = await createTestUser();
      const post = await createTestPost(owner.id);
      const cookie = getAuthCookie(viewer.id);

      const res = await request(app)
        .get(`/api/v1/posts/${post.id}/save`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.saved).toBe(false);
    });

    it('should return saved=true after the post is saved', async () => {
      const owner = await createTestUser();
      const saver = await createTestUser();
      const post = await createTestPost(owner.id);
      const cookie = getAuthCookie(saver.id);

      await request(app).post(`/api/v1/posts/${post.id}/save`).set('Cookie', cookie);

      const res = await request(app)
        .get(`/api/v1/posts/${post.id}/save`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.saved).toBe(true);
    });

    it('should be scoped per-user (other users do not see the save)', async () => {
      const owner = await createTestUser();
      const saver = await createTestUser();
      const other = await createTestUser();
      const post = await createTestPost(owner.id);

      await request(app)
        .post(`/api/v1/posts/${post.id}/save`)
        .set('Cookie', getAuthCookie(saver.id));

      const res = await request(app)
        .get(`/api/v1/posts/${post.id}/save`)
        .set('Cookie', getAuthCookie(other.id));

      expect(res.status).toBe(200);
      expect(res.body.data.saved).toBe(false);
    });

    it('should require auth', async () => {
      const owner = await createTestUser();
      const post = await createTestPost(owner.id);

      const res = await request(app).get(`/api/v1/posts/${post.id}/save`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/saves', () => {
    it('should return the list of saved posts for the authenticated user', async () => {
      const owner = await createTestUser();
      const saver = await createTestUser();
      const post = await createTestPost(owner.id, { caption: 'A saved memory' });
      const cookie = getAuthCookie(saver.id);

      await request(app).post(`/api/v1/posts/${post.id}/save`).set('Cookie', cookie);

      const res = await request(app).get('/api/v1/saves').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].id).toBe(post.id);
      expect(res.body.data.items[0].caption).toBe('A saved memory');
      expect(res.body.data.items[0].savedAt).toBeDefined();
    });

    it('should return an empty list when the user has saved nothing', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app).get('/api/v1/saves').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
      expect(res.body.data.nextCursor).toBeNull();
    });

    it('should not include posts saved by other users', async () => {
      const owner = await createTestUser();
      const saver = await createTestUser();
      const other = await createTestUser();
      const post = await createTestPost(owner.id);

      await request(app)
        .post(`/api/v1/posts/${post.id}/save`)
        .set('Cookie', getAuthCookie(saver.id));

      const res = await request(app)
        .get('/api/v1/saves')
        .set('Cookie', getAuthCookie(other.id));

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });

    it('should exclude soft-deleted posts from the saved list', async () => {
      const owner = await createTestUser();
      const saver = await createTestUser();
      const post = await createTestPost(owner.id);
      const cookie = getAuthCookie(saver.id);

      await request(app).post(`/api/v1/posts/${post.id}/save`).set('Cookie', cookie);

      // Soft delete the post directly; the Save row remains but should be filtered out.
      await prisma.post.update({
        where: { id: post.id },
        data: { isDeleted: true },
      });

      const res = await request(app).get('/api/v1/saves').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });

    it('should require auth', async () => {
      const res = await request(app).get('/api/v1/saves');

      expect(res.status).toBe(401);
    });
  });
});
