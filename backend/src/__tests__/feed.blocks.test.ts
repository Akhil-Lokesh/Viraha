import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

/**
 * Personalized feed (GET /api/v1/feed) must exclude blocked users symmetrically.
 *
 * The personalized feed only surfaces posts authored by the viewer or by users
 * the viewer follows (status 'accepted'). getHiddenUserIds() unions both
 * directions of the Block relation (users the viewer blocked + users who blocked
 * the viewer), and those ids are filtered out of the feed's author set.
 *
 * Blocks that can't be created through a normal flow here are inserted directly
 * via prisma using the real column names (blockerId / blockedId) so each case
 * controls exactly which direction the block points.
 */
describe('Feed block exclusion', () => {
  type FeedItem = { userId: string; privacy: string };

  async function fetchFeed(viewerId: string): Promise<FeedItem[]> {
    const res = await request(app)
      .get('/api/v1/feed')
      .set('Cookie', getAuthCookie(viewerId));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    return res.body.data.items as FeedItem[];
  }

  it('shows a followed user’s public post in the viewer’s feed (no block)', async () => {
    const viewer = await createTestUser();
    const author = await createTestUser();
    const post = await createTestPost(author.id, { privacy: 'public', caption: 'visible post' });

    // Viewer follows author so the author's posts are eligible for the feed.
    const followRes = await request(app)
      .post(`/api/v1/users/${author.id}/follow`)
      .set('Cookie', getAuthCookie(viewer.id))
      .send({});
    expect(followRes.status).toBe(201);

    const items = await fetchFeed(viewer.id);
    const ids = items.map((p) => (p as { id?: string }).id ?? '');
    expect(ids).toContain(post.id);
    expect(items.some((p) => p.userId === author.id)).toBe(true);
  });

  it('hides a followed user’s post after the viewer blocks them', async () => {
    const viewer = await createTestUser();
    const author = await createTestUser();
    await createTestPost(author.id, { privacy: 'public', caption: 'to be hidden' });

    await request(app)
      .post(`/api/v1/users/${author.id}/follow`)
      .set('Cookie', getAuthCookie(viewer.id))
      .send({});

    // Viewer blocks the author (viewer = blocker, author = blocked).
    await prisma.block.create({ data: { blockerId: viewer.id, blockedId: author.id } });

    const items = await fetchFeed(viewer.id);
    expect(items.some((p) => p.userId === author.id)).toBe(false);
  });

  it('symmetric: hides posts of a user who blocked the viewer', async () => {
    const viewer = await createTestUser();
    const author = await createTestUser();
    await createTestPost(author.id, { privacy: 'public', caption: 'blocked-author post' });

    await request(app)
      .post(`/api/v1/users/${author.id}/follow`)
      .set('Cookie', getAuthCookie(viewer.id))
      .send({});

    // Author blocks the viewer (author = blocker, viewer = blocked) — the viewer
    // never initiated the block, yet the author's posts must still be hidden.
    await prisma.block.create({ data: { blockerId: author.id, blockedId: viewer.id } });

    const items = await fetchFeed(viewer.id);
    expect(items.some((p) => p.userId === author.id)).toBe(false);
  });

  it('blocking one followed user does not hide other followed users or own posts', async () => {
    const viewer = await createTestUser();
    const blockedAuthor = await createTestUser();
    const otherAuthor = await createTestUser();

    await createTestPost(blockedAuthor.id, { privacy: 'public', caption: 'hidden' });
    const visiblePost = await createTestPost(otherAuthor.id, { privacy: 'public', caption: 'still visible' });
    const ownPost = await createTestPost(viewer.id, { privacy: 'public', caption: 'my own post' });

    const cookie = getAuthCookie(viewer.id);
    await request(app).post(`/api/v1/users/${blockedAuthor.id}/follow`).set('Cookie', cookie).send({});
    await request(app).post(`/api/v1/users/${otherAuthor.id}/follow`).set('Cookie', cookie).send({});

    await prisma.block.create({ data: { blockerId: viewer.id, blockedId: blockedAuthor.id } });

    const items = await fetchFeed(viewer.id);
    const ids = items.map((p) => (p as { id?: string }).id ?? '');

    expect(items.some((p) => p.userId === blockedAuthor.id)).toBe(false);
    expect(ids).toContain(visiblePost.id);
    expect(ids).toContain(ownPost.id);
  });
});
