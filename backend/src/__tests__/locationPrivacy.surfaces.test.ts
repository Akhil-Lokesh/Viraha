import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

/**
 * Location privacy on the secondary serialization surfaces: nearby feed,
 * saved-posts list, and the create/update API wiring for showLocation.
 * Complements locationPrivacy.test.ts (detail, list, feed, map, featured).
 */

const NEARBY = '/api/v1/travel/nearby?lat=40.7128&lng=-74.006&radius=50';

describe('Nearby feed location privacy', () => {
  it('excludes showLocation=false posts for everyone but the owner', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const hidden = await createTestPost(owner.id, { showLocation: false, privacy: 'public' });
    const visible = await createTestPost(owner.id, { privacy: 'public' });

    const asStranger = await request(app)
      .get(NEARBY)
      .set('Cookie', getAuthCookie(stranger.id));
    expect(asStranger.status).toBe(200);
    const strangerIds = (asStranger.body.data.items as Array<{ id: string }>).map((p) => p.id);
    expect(strangerIds).toContain(visible.id);
    expect(strangerIds).not.toContain(hidden.id);

    const asOwner = await request(app)
      .get(NEARBY)
      .set('Cookie', getAuthCookie(owner.id));
    expect(asOwner.status).toBe(200);
    const ownerItems = asOwner.body.data.items as Array<{ id: string; locationLat: unknown }>;
    const ownerIds = ownerItems.map((p) => p.id);
    expect(ownerIds).toContain(visible.id);
    expect(ownerIds).toContain(hidden.id);
    const ownHidden = ownerItems.find((p) => p.id === hidden.id);
    expect(Number(ownHidden!.locationLat)).toBeCloseTo(40.7128);
  });

  it('never returns coordinates of hidden posts in any page item', async () => {
    const owner = await createTestUser();
    const viewer = await createTestUser();
    await createTestPost(owner.id, { showLocation: false, privacy: 'public' });

    const res = await request(app).get(NEARBY).set('Cookie', getAuthCookie(viewer.id));
    expect(res.status).toBe(200);
    for (const item of res.body.data.items as Array<{
      userId: string;
      showLocation: boolean;
      locationLat: unknown;
    }>) {
      if (item.userId !== viewer.id && item.showLocation === false) {
        // Excluded at the query level, so this branch should be unreachable.
        expect.unreachable('hidden post leaked into a stranger nearby feed');
      }
    }
  });
});

describe('Saved posts location privacy', () => {
  it("redacts coordinates of someone else's hidden post in the saved list", async () => {
    const owner = await createTestUser();
    const saver = await createTestUser();
    const hidden = await createTestPost(owner.id, { showLocation: false, privacy: 'public' });
    await prisma.save.create({ data: { userId: saver.id, postId: hidden.id } });

    const res = await request(app)
      .get('/api/v1/saves')
      .set('Cookie', getAuthCookie(saver.id));
    expect(res.status).toBe(200);
    const item = (
      res.body.data.items as Array<{ id: string; locationLat: unknown; locationName: string }>
    ).find((p) => p.id === hidden.id);
    expect(item).toBeDefined();
    expect(item!.locationLat).toBeNull();
    expect(item!.locationName).toBe('New York'); // coarse fields stay visible
  });

  it("keeps coordinates on the owner's own hidden post in their saved list", async () => {
    const owner = await createTestUser();
    const post = await createTestPost(owner.id, { showLocation: false, privacy: 'public' });
    await prisma.save.create({ data: { userId: owner.id, postId: post.id } });

    const res = await request(app)
      .get('/api/v1/saves')
      .set('Cookie', getAuthCookie(owner.id));
    expect(res.status).toBe(200);
    const item = (res.body.data.items as Array<{ id: string; locationLat: unknown }>).find(
      (p) => p.id === post.id
    );
    expect(item).toBeDefined();
    expect(Number(item!.locationLat)).toBeCloseTo(40.7128);
  });
});

describe('Search post mute filtering', () => {
  it("excludes a muted user's posts from search results", async () => {
    const viewer = await createTestUser();
    const mutedAuthor = await createTestUser();
    const normalAuthor = await createTestUser();
    const mutedPost = await createTestPost(mutedAuthor.id, {
      caption: 'sunset over kyoto',
      privacy: 'public',
    });
    const normalPost = await createTestPost(normalAuthor.id, {
      caption: 'sunset over lisbon',
      privacy: 'public',
    });
    await prisma.mute.create({ data: { muterId: viewer.id, mutedId: mutedAuthor.id } });

    const res = await request(app)
      .get('/api/v1/posts/search?q=sunset')
      .set('Cookie', getAuthCookie(viewer.id));
    expect(res.status).toBe(200);
    const ids = (res.body.data.items as Array<{ id: string }>).map((p) => p.id);
    expect(ids).toContain(normalPost.id);
    expect(ids).not.toContain(mutedPost.id);
  });

  it('still applies block filtering alongside mutes', async () => {
    const viewer = await createTestUser();
    const blockedAuthor = await createTestUser();
    const blockedPost = await createTestPost(blockedAuthor.id, {
      caption: 'sunset over oslo',
      privacy: 'public',
    });
    await prisma.block.create({ data: { blockerId: viewer.id, blockedId: blockedAuthor.id } });

    const res = await request(app)
      .get('/api/v1/posts/search?q=sunset')
      .set('Cookie', getAuthCookie(viewer.id));
    expect(res.status).toBe(200);
    const ids = (res.body.data.items as Array<{ id: string }>).map((p) => p.id);
    expect(ids).not.toContain(blockedPost.id);
  });
});

describe('showLocation via the posts API', () => {
  const basePayload = {
    caption: 'private spot',
    mediaUrls: ['https://example.com/photo.jpg'],
    locationLat: 40.7128,
    locationLng: -74.006,
    locationName: 'New York',
  };

  it('creates a post with showLocation=false; stranger gets null coords, owner real', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();

    const created = await request(app)
      .post('/api/v1/posts')
      .set('Cookie', getAuthCookie(owner.id))
      .send({ ...basePayload, showLocation: false });
    expect(created.status).toBe(201);
    expect(created.body.data.post.showLocation).toBe(false);
    const postId = created.body.data.post.id as string;

    const asStranger = await request(app)
      .get(`/api/v1/posts/${postId}`)
      .set('Cookie', getAuthCookie(stranger.id));
    expect(asStranger.status).toBe(200);
    expect(asStranger.body.data.post.locationLat).toBeNull();
    expect(asStranger.body.data.post.locationLng).toBeNull();

    const asOwner = await request(app)
      .get(`/api/v1/posts/${postId}`)
      .set('Cookie', getAuthCookie(owner.id));
    expect(asOwner.status).toBe(200);
    expect(Number(asOwner.body.data.post.locationLat)).toBeCloseTo(40.7128);
  });

  it('defaults showLocation to true when omitted on create', async () => {
    const owner = await createTestUser();

    const created = await request(app)
      .post('/api/v1/posts')
      .set('Cookie', getAuthCookie(owner.id))
      .send(basePayload);
    expect(created.status).toBe(201);
    expect(created.body.data.post.showLocation).toBe(true);
  });

  it('rejects a non-boolean showLocation', async () => {
    const owner = await createTestUser();

    const res = await request(app)
      .post('/api/v1/posts')
      .set('Cookie', getAuthCookie(owner.id))
      .send({ ...basePayload, showLocation: 'yes' });
    expect(res.status).toBe(400);
  });

  it('toggles showLocation through update and changes stranger visibility', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const post = await createTestPost(owner.id, { privacy: 'public' }); // showLocation=true

    // Turn it off
    const off = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set('Cookie', getAuthCookie(owner.id))
      .send({ showLocation: false });
    expect(off.status).toBe(200);
    expect(off.body.data.post.showLocation).toBe(false);

    const hiddenView = await request(app)
      .get(`/api/v1/posts/${post.id}`)
      .set('Cookie', getAuthCookie(stranger.id));
    expect(hiddenView.body.data.post.locationLat).toBeNull();

    // Turn it back on
    const on = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set('Cookie', getAuthCookie(owner.id))
      .send({ showLocation: true });
    expect(on.status).toBe(200);
    expect(on.body.data.post.showLocation).toBe(true);

    const visibleView = await request(app)
      .get(`/api/v1/posts/${post.id}`)
      .set('Cookie', getAuthCookie(stranger.id));
    expect(Number(visibleView.body.data.post.locationLat)).toBeCloseTo(40.7128);
  });

  it("does not allow a stranger's update to change showLocation", async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const post = await createTestPost(owner.id, { showLocation: false, privacy: 'public' });

    const res = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set('Cookie', getAuthCookie(stranger.id))
      .send({ showLocation: true });
    expect(res.status).toBe(403);

    const row = await prisma.post.findUnique({ where: { id: post.id } });
    expect(row!.showLocation).toBe(false);
  });
});
