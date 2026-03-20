import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie } from './factories';

describe('Posts API', () => {
  describe('POST /api/v1/posts', () => {
    it('should create a post', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post('/api/v1/posts')
        .set('Cookie', cookie)
        .send({
          caption: 'Hello world',
          mediaUrls: ['https://example.com/photo.jpg'],
          locationLat: 40.7128,
          locationLng: -74.006,
          locationName: 'New York',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.post.caption).toBe('Hello world');
    });

    it('should require auth', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .send({ caption: 'test', mediaUrls: [], locationLat: 0, locationLng: 0 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/posts', () => {
    it('should return public posts for unauthenticated users', async () => {
      const user = await createTestUser();
      await createTestPost(user.id, { privacy: 'public' });
      await createTestPost(user.id, { privacy: 'private' });

      const res = await request(app).get('/api/v1/posts');

      expect(res.status).toBe(200);
      const publicPosts = res.body.data.items.filter((p: any) => p.privacy === 'public');
      const privatePosts = res.body.data.items.filter((p: any) => p.privacy === 'private');
      expect(publicPosts.length).toBeGreaterThan(0);
      expect(privatePosts.length).toBe(0);
    });

    it('should include own private posts when authenticated', async () => {
      const user = await createTestUser();
      await createTestPost(user.id, { privacy: 'private' });
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .get('/api/v1/posts')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      const ownPrivate = res.body.data.items.filter(
        (p: any) => p.userId === user.id && p.privacy === 'private'
      );
      expect(ownPrivate.length).toBe(1);
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    it('should return a public post', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);

      const res = await request(app).get(`/api/v1/posts/${post.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.post.id).toBe(post.id);
    });

    it('should hide private posts from non-owners', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id, { privacy: 'private' });

      const res = await request(app).get(`/api/v1/posts/${post.id}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    it('should soft delete own post', async () => {
      const user = await createTestUser();
      const post = await createTestPost(user.id);
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .delete(`/api/v1/posts/${post.id}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(200);

      // Verify soft deleted
      const getRes = await request(app).get(`/api/v1/posts/${post.id}`);
      expect(getRes.status).toBe(404);
    });

    it('should not delete other user posts', async () => {
      const owner = await createTestUser();
      const other = await createTestUser();
      const post = await createTestPost(owner.id);
      const cookie = getAuthCookie(other.id);

      const res = await request(app)
        .delete(`/api/v1/posts/${post.id}`)
        .set('Cookie', cookie);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/posts/search', () => {
    it('should search posts by caption', async () => {
      const user = await createTestUser();
      await createTestPost(user.id, { caption: 'Beautiful sunset in Bali' });

      const res = await request(app).get('/api/v1/posts/search?q=Bali');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('should return empty for no match', async () => {
      const res = await request(app).get('/api/v1/posts/search?q=xyznonexistent');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });
});
