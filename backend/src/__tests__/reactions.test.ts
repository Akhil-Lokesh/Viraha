import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from './setup';
import { createTestUser, createTestPost, createTestFollow, getAuthCookie } from './factories';

describe('Reactions API — POST /api/v1/posts/:postId/like', () => {
  it('likes a post and returns liked=true with incremented count', async () => {
    const author = await createTestUser();
    const liker = await createTestUser();
    const post = await createTestPost(author.id);

    const res = await request(app)
      .post(`/api/v1/posts/${post.id}/like`)
      .set('Cookie', getAuthCookie(liker.id));

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      data: { liked: true, likeCount: 1 },
    });

    const reaction = await prisma.reaction.findUnique({
      where: { userId_postId_type: { userId: liker.id, postId: post.id, type: 'like' } },
    });
    expect(reaction).not.toBeNull();
  });

  it('toggles off when called a second time (idempotent unlike)', async () => {
    const author = await createTestUser();
    const liker = await createTestUser();
    const post = await createTestPost(author.id);
    const cookie = getAuthCookie(liker.id);

    await request(app).post(`/api/v1/posts/${post.id}/like`).set('Cookie', cookie);
    const res = await request(app)
      .post(`/api/v1/posts/${post.id}/like`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { liked: false, likeCount: 0 },
    });
  });

  it('creates an Activity for the post owner with type=like', async () => {
    const author = await createTestUser();
    const liker = await createTestUser();
    const post = await createTestPost(author.id);

    await request(app)
      .post(`/api/v1/posts/${post.id}/like`)
      .set('Cookie', getAuthCookie(liker.id));

    const activities = await prisma.activity.findMany({
      where: { userId: author.id, actorId: liker.id, type: 'like' },
    });
    expect(activities).toHaveLength(1);
    expect(activities[0].postId).toBe(post.id);
  });

  it('lets a user like their own post (no self-exclusion) but creates no activity', async () => {
    const user = await createTestUser();
    const post = await createTestPost(user.id);

    const res = await request(app)
      .post(`/api/v1/posts/${post.id}/like`)
      .set('Cookie', getAuthCookie(user.id));

    expect(res.status).toBe(201);
    expect(res.body.data.liked).toBe(true);

    const activities = await prisma.activity.findMany({ where: { userId: user.id } });
    expect(activities).toHaveLength(0);
  });

  it('returns 404 when liking a deleted post', async () => {
    const author = await createTestUser();
    const liker = await createTestUser();
    const post = await createTestPost(author.id, { isDeleted: true });

    const res = await request(app)
      .post(`/api/v1/posts/${post.id}/like`)
      .set('Cookie', getAuthCookie(liker.id));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 when liking a followers-only post as a non-follower', async () => {
    const author = await createTestUser();
    const stranger = await createTestUser();
    const post = await createTestPost(author.id, { privacy: 'followers' });

    const res = await request(app)
      .post(`/api/v1/posts/${post.id}/like`)
      .set('Cookie', getAuthCookie(stranger.id));

    expect(res.status).toBe(404);
  });

  it('allows liking a followers-only post as an accepted follower', async () => {
    const author = await createTestUser();
    const follower = await createTestUser();
    const post = await createTestPost(author.id, { privacy: 'followers' });
    await createTestFollow(follower.id, author.id);

    const res = await request(app)
      .post(`/api/v1/posts/${post.id}/like`)
      .set('Cookie', getAuthCookie(follower.id));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ liked: true, likeCount: 1 });
  });

  it('returns 401 when unauthenticated', async () => {
    const author = await createTestUser();
    const post = await createTestPost(author.id);

    const res = await request(app).post(`/api/v1/posts/${post.id}/like`);

    expect(res.status).toBe(401);
  });
});
