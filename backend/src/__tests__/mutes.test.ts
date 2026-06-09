import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

/**
 * Mutes are one-way and invisible to the muted user: the muter stops seeing
 * the muted user's posts in the feed and their actions in the activity
 * stream, but profiles, post detail pages, and comments stay visible.
 */
describe('Mute endpoints', () => {
  it('mutes a user and is idempotent on repeat', async () => {
    const muter = await createTestUser();
    const target = await createTestUser();

    const res = await request(app)
      .post(`/api/v1/users/${target.username}/mute`)
      .set('Cookie', getAuthCookie(muter.id))
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const again = await request(app)
      .post(`/api/v1/users/${target.username}/mute`)
      .set('Cookie', getAuthCookie(muter.id))
      .send({});
    expect(again.status).toBe(200);
    expect(again.body.success).toBe(true);

    const rows = await prisma.mute.findMany({ where: { muterId: muter.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].mutedId).toBe(target.id);
  });

  it('rejects muting yourself with 400', async () => {
    const user = await createTestUser();

    const res = await request(app)
      .post(`/api/v1/users/${user.username}/mute`)
      .set('Cookie', getAuthCookie(user.id))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 404 when muting an unknown username', async () => {
    const user = await createTestUser();

    const res = await request(app)
      .post('/api/v1/users/no_such_user_xyz/mute')
      .set('Cookie', getAuthCookie(user.id))
      .send({});
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('requires authentication', async () => {
    const target = await createTestUser();
    const res = await request(app).post(`/api/v1/users/${target.username}/mute`).send({});
    expect(res.status).toBe(401);
  });

  it('unmutes a user and is idempotent on repeat', async () => {
    const muter = await createTestUser();
    const target = await createTestUser();
    await prisma.mute.create({ data: { muterId: muter.id, mutedId: target.id } });

    const res = await request(app)
      .delete(`/api/v1/users/${target.username}/mute`)
      .set('Cookie', getAuthCookie(muter.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const again = await request(app)
      .delete(`/api/v1/users/${target.username}/mute`)
      .set('Cookie', getAuthCookie(muter.id));
    expect(again.status).toBe(200);

    const rows = await prisma.mute.findMany({ where: { muterId: muter.id } });
    expect(rows).toHaveLength(0);
  });

  it('returns 404 when unmuting an unknown username', async () => {
    const user = await createTestUser();

    const res = await request(app)
      .delete('/api/v1/users/no_such_user_xyz/mute')
      .set('Cookie', getAuthCookie(user.id));
    expect(res.status).toBe(404);
  });

  it('lists muted users with the documented shape', async () => {
    const muter = await createTestUser();
    const target = await createTestUser();
    await prisma.mute.create({ data: { muterId: muter.id, mutedId: target.id } });

    const res = await request(app)
      .get('/api/v1/users/me/muted')
      .set('Cookie', getAuthCookie(muter.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users).toHaveLength(1);
    const entry = res.body.data.users[0];
    expect(entry.id).toBe(target.id);
    expect(entry.username).toBe(target.username);
    expect(entry.displayName).toBe(target.displayName);
    expect(entry).toHaveProperty('avatar');
    expect(entry.mutedAt).toBeTruthy();
  });
});

describe('Mute feed exclusion', () => {
  async function fetchFeedIds(viewerId: string): Promise<string[]> {
    const res = await request(app)
      .get('/api/v1/feed')
      .set('Cookie', getAuthCookie(viewerId));
    expect(res.status).toBe(200);
    return (res.body.data.items as Array<{ id: string }>).map((p) => p.id);
  }

  it("hides a muted user's posts from the personalized feed and restores them on unmute", async () => {
    const viewer = await createTestUser();
    const author = await createTestUser();
    await prisma.follow.create({
      data: { followerId: viewer.id, followingId: author.id, status: 'accepted' },
    });
    const post = await createTestPost(author.id, { privacy: 'public' });

    expect(await fetchFeedIds(viewer.id)).toContain(post.id);

    await request(app)
      .post(`/api/v1/users/${author.username}/mute`)
      .set('Cookie', getAuthCookie(viewer.id))
      .send({});
    expect(await fetchFeedIds(viewer.id)).not.toContain(post.id);

    await request(app)
      .delete(`/api/v1/users/${author.username}/mute`)
      .set('Cookie', getAuthCookie(viewer.id));
    expect(await fetchFeedIds(viewer.id)).toContain(post.id);
  });

  it("hides a muted user's posts from the discover feed", async () => {
    const viewer = await createTestUser();
    const author = await createTestUser();
    const post = await createTestPost(author.id, { privacy: 'public' });

    await prisma.mute.create({ data: { muterId: viewer.id, mutedId: author.id } });

    const res = await request(app)
      .get('/api/v1/feed/discover')
      .set('Cookie', getAuthCookie(viewer.id));
    expect(res.status).toBe(200);
    const ids = (res.body.data.items as Array<{ id: string }>).map((p) => p.id);
    expect(ids).not.toContain(post.id);
  });

  it('does not hide the profile or post detail of a muted user', async () => {
    const viewer = await createTestUser();
    const author = await createTestUser();
    const post = await createTestPost(author.id, { privacy: 'public' });
    await prisma.mute.create({ data: { muterId: viewer.id, mutedId: author.id } });

    const profile = await request(app)
      .get(`/api/v1/users/${author.username}`)
      .set('Cookie', getAuthCookie(viewer.id));
    expect(profile.status).toBe(200);

    const detail = await request(app)
      .get(`/api/v1/posts/${post.id}`)
      .set('Cookie', getAuthCookie(viewer.id));
    expect(detail.status).toBe(200);
    expect(detail.body.data.post.id).toBe(post.id);
  });
});

describe('Mute activity exclusion', () => {
  it('excludes activities from muted actors in the list and unread count', async () => {
    const viewer = await createTestUser();
    const mutedActor = await createTestUser();
    const normalActor = await createTestUser();
    const post = await createTestPost(viewer.id);

    await prisma.activity.createMany({
      data: [
        { userId: viewer.id, actorId: mutedActor.id, type: 'save', postId: post.id, read: false },
        { userId: viewer.id, actorId: normalActor.id, type: 'save', postId: post.id, read: false },
      ],
    });
    await prisma.mute.create({ data: { muterId: viewer.id, mutedId: mutedActor.id } });

    const list = await request(app)
      .get('/api/v1/activities')
      .set('Cookie', getAuthCookie(viewer.id));
    expect(list.status).toBe(200);
    const actorIds = (list.body.data.items as Array<{ actorId: string }>).map((a) => a.actorId);
    expect(actorIds).toContain(normalActor.id);
    expect(actorIds).not.toContain(mutedActor.id);

    const unread = await request(app)
      .get('/api/v1/activities/unread')
      .set('Cookie', getAuthCookie(viewer.id));
    expect(unread.status).toBe(200);
    expect(unread.body.data.count).toBe(1);
  });
});

describe('Blocked vs muted coexistence', () => {
  it('keeps a blocked user hidden from the feed even after unmute', async () => {
    const viewer = await createTestUser();
    const author = await createTestUser();
    await prisma.follow.create({
      data: { followerId: viewer.id, followingId: author.id, status: 'accepted' },
    });
    const post = await createTestPost(author.id, { privacy: 'public' });

    await prisma.mute.create({ data: { muterId: viewer.id, mutedId: author.id } });
    await prisma.block.create({ data: { blockerId: viewer.id, blockedId: author.id } });

    const before = await request(app)
      .get('/api/v1/feed')
      .set('Cookie', getAuthCookie(viewer.id));
    expect((before.body.data.items as Array<{ id: string }>).map((p) => p.id)).not.toContain(
      post.id
    );

    // Unmute — the block alone must keep the post hidden.
    await request(app)
      .delete(`/api/v1/users/${author.username}/mute`)
      .set('Cookie', getAuthCookie(viewer.id));

    const after = await request(app)
      .get('/api/v1/feed')
      .set('Cookie', getAuthCookie(viewer.id));
    expect((after.body.data.items as Array<{ id: string }>).map((p) => p.id)).not.toContain(
      post.id
    );
  });
});
