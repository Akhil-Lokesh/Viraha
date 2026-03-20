import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, getAuthCookie } from './factories';

describe('Follows API', () => {
  describe('POST /api/v1/users/:userId/follow', () => {
    it('should follow a user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const cookie = getAuthCookie(user1.id);

      const res = await request(app)
        .post(`/api/v1/users/${user2.id}/follow`)
        .set('Cookie', cookie);

      expect(res.status).toBe(201);
      expect(res.body.data.follow.status).toBe('accepted');
    });

    it('should not follow yourself', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post(`/api/v1/users/${user.id}/follow`)
        .set('Cookie', cookie);

      expect(res.status).toBe(400);
    });

    it('should not duplicate follow', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const cookie = getAuthCookie(user1.id);

      await request(app).post(`/api/v1/users/${user2.id}/follow`).set('Cookie', cookie);
      const res = await request(app).post(`/api/v1/users/${user2.id}/follow`).set('Cookie', cookie);

      expect(res.status).toBe(409);
    });
  });

  describe('DELETE /api/v1/users/:userId/follow', () => {
    it('should unfollow a user', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const cookie = getAuthCookie(user1.id);

      await request(app).post(`/api/v1/users/${user2.id}/follow`).set('Cookie', cookie);
      const res = await request(app).delete(`/api/v1/users/${user2.id}/follow`).set('Cookie', cookie);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/users/:userId/followers', () => {
    it('should list followers with pagination', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const cookie = getAuthCookie(user2.id);

      await request(app).post(`/api/v1/users/${user1.id}/follow`).set('Cookie', cookie);

      const res = await request(app).get(`/api/v1/users/${user1.id}/followers`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].id).toBe(user2.id);
    });
  });

  describe('GET /api/v1/users/:userId/following', () => {
    it('should list following', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const cookie = getAuthCookie(user1.id);

      await request(app).post(`/api/v1/users/${user2.id}/follow`).set('Cookie', cookie);

      const res = await request(app).get(`/api/v1/users/${user1.id}/following`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].id).toBe(user2.id);
    });
  });
});
