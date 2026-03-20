import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, createTestAlbum, getAuthCookie } from './factories';

describe('Albums API', () => {
  describe('POST /api/v1/albums', () => {
    it('should create an album with date range', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .post('/api/v1/albums')
        .set('Cookie', cookie)
        .send({
          title: 'Japan Trip',
          startDate: '2024-03-01T00:00:00.000Z',
          endDate: '2024-03-15T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.album.title).toBe('Japan Trip');
      expect(res.body.data.album.startDate).toBeTruthy();
      expect(res.body.data.album.endDate).toBeTruthy();
    });
  });

  describe('GET /api/v1/albums', () => {
    it('should return public albums', async () => {
      const user = await createTestUser();
      await createTestAlbum(user.id, { privacy: 'public' });

      const res = await request(app).get('/api/v1/albums');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('should hide private albums from unauthenticated', async () => {
      const user = await createTestUser();
      await createTestAlbum(user.id, { privacy: 'private' });

      const res = await request(app).get('/api/v1/albums');

      const privateAlbums = res.body.data.items.filter((a: any) => a.privacy === 'private');
      expect(privateAlbums.length).toBe(0);
    });
  });

  describe('Album posts', () => {
    it('should add and remove a post from an album', async () => {
      const user = await createTestUser();
      const album = await createTestAlbum(user.id);
      const post = await createTestPost(user.id);
      const cookie = getAuthCookie(user.id);

      // Add
      const addRes = await request(app)
        .post(`/api/v1/albums/${album.id}/posts`)
        .set('Cookie', cookie)
        .send({ postId: post.id });

      expect(addRes.status).toBe(201);

      // Remove
      const removeRes = await request(app)
        .delete(`/api/v1/albums/${album.id}/posts/${post.id}`)
        .set('Cookie', cookie);

      expect(removeRes.status).toBe(200);
    });
  });

  describe('PUT /api/v1/albums/:id', () => {
    it('should update album date range', async () => {
      const user = await createTestUser();
      const album = await createTestAlbum(user.id);
      const cookie = getAuthCookie(user.id);

      const res = await request(app)
        .put(`/api/v1/albums/${album.id}`)
        .set('Cookie', cookie)
        .send({ startDate: '2024-06-01T00:00:00.000Z' });

      expect(res.status).toBe(200);
      expect(res.body.data.album.startDate).toBeTruthy();
    });
  });
});
