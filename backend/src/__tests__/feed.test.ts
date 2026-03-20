import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

describe('Feed API', () => {
  describe('GET /api/v1/feed', () => {
    it('should include posts from followed users', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestPost(user2.id, { caption: 'From followed user' });
      const cookie1 = getAuthCookie(user1.id);

      // Follow user2
      await request(app).post(`/api/v1/users/${user2.id}/follow`).set('Cookie', cookie1);

      const res = await request(app)
        .get('/api/v1/feed')
        .set('Cookie', cookie1);

      expect(res.status).toBe(200);
      const fromUser2 = res.body.data.items.filter((p: any) => p.userId === user2.id);
      expect(fromUser2.length).toBeGreaterThan(0);
    });

    it('should exclude private posts from non-followed users', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      await createTestPost(user2.id, { privacy: 'private', caption: 'Secret post' });
      const cookie1 = getAuthCookie(user1.id);

      const res = await request(app)
        .get('/api/v1/feed')
        .set('Cookie', cookie1);

      expect(res.status).toBe(200);
      const privateFromUser2 = res.body.data.items.filter(
        (p: any) => p.userId === user2.id && p.privacy === 'private'
      );
      expect(privateFromUser2.length).toBe(0);
    });

    it('should include own posts', async () => {
      const user = await createTestUser();
      await createTestPost(user.id, { caption: 'My own post' });
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .get('/api/v1/feed')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      const ownPosts = res.body.data.items.filter((p: any) => p.userId === user.id);
      expect(ownPosts.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/feed/discover', () => {
    it('should return public posts for unauthenticated users', async () => {
      const user = await createTestUser();
      await createTestPost(user.id, { privacy: 'public' });

      const res = await request(app).get('/api/v1/feed/discover');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });
  });
});
