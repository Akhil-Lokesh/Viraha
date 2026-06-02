import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

describe('PATCH /api/v1/posts/:id — privacy update authorization', () => {
  it('owner can change post privacy from public to private and it persists', async () => {
    const owner = await createTestUser();
    const post = await createTestPost(owner.id, { privacy: 'public' });
    const cookie = getAuthCookie(owner.id);

    const res = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set('Cookie', cookie)
      .send({ privacy: 'private' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post.privacy).toBe('private');

    const persisted = await prisma.post.findUnique({ where: { id: post.id } });
    expect(persisted?.privacy).toBe('private');
  });

  it('non-owner cannot change privacy and gets 403, privacy unchanged', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const post = await createTestPost(owner.id, { privacy: 'public' });
    const cookie = getAuthCookie(other.id);

    const res = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set('Cookie', cookie)
      .send({ privacy: 'private' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');

    const persisted = await prisma.post.findUnique({ where: { id: post.id } });
    expect(persisted?.privacy).toBe('public');
  });

  it('unauthenticated request to change privacy gets 401, privacy unchanged', async () => {
    const owner = await createTestUser();
    const post = await createTestPost(owner.id, { privacy: 'public' });

    const res = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .send({ privacy: 'private' });

    expect(res.status).toBe(401);

    const persisted = await prisma.post.findUnique({ where: { id: post.id } });
    expect(persisted?.privacy).toBe('public');
  });

  it('updating a non-existent post returns 404', async () => {
    const owner = await createTestUser();
    const cookie = getAuthCookie(owner.id);

    const res = await request(app)
      .patch('/api/v1/posts/nonexistent-post-id')
      .set('Cookie', cookie)
      .send({ privacy: 'private' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('updating a soft-deleted post returns 404 even for the owner', async () => {
    const owner = await createTestUser();
    const post = await createTestPost(owner.id, { privacy: 'public', isDeleted: true });
    const cookie = getAuthCookie(owner.id);

    const res = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set('Cookie', cookie)
      .send({ privacy: 'private' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects an invalid privacy value with a 400', async () => {
    const owner = await createTestUser();
    const post = await createTestPost(owner.id, { privacy: 'public' });
    const cookie = getAuthCookie(owner.id);

    const res = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set('Cookie', cookie)
      .send({ privacy: 'everyone' });

    expect(res.status).toBe(400);

    const persisted = await prisma.post.findUnique({ where: { id: post.id } });
    expect(persisted?.privacy).toBe('public');
  });
});
