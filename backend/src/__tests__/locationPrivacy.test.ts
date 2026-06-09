import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';
import { redactPostLocation, redactPostsLocation } from '../utils/locationPrivacy';

describe('redactPostLocation (unit)', () => {
  const base = {
    userId: 'owner-id',
    locationLat: 40.7128,
    locationLng: -74.006,
    locationName: 'New York',
    showLocation: false,
  };

  it('nulls coordinates for a stranger and keeps coarse fields', () => {
    const result = redactPostLocation(base, 'someone-else');
    expect(result.locationLat).toBeNull();
    expect(result.locationLng).toBeNull();
    expect(result.locationName).toBe('New York');
  });

  it('nulls coordinates for anonymous viewers', () => {
    const result = redactPostLocation(base, null);
    expect(result.locationLat).toBeNull();
    expect(result.locationLng).toBeNull();
  });

  it('keeps coordinates for the owner', () => {
    const result = redactPostLocation(base, 'owner-id');
    expect(result.locationLat).toBe(40.7128);
    expect(result.locationLng).toBe(-74.006);
  });

  it('leaves showLocation=true posts untouched', () => {
    const visible = { ...base, showLocation: true };
    const result = redactPostLocation(visible, null);
    expect(result.locationLat).toBe(40.7128);
  });

  it('does not mutate the original post (immutability)', () => {
    const result = redactPostLocation(base, null);
    expect(result).not.toBe(base);
    expect(base.locationLat).toBe(40.7128);
    expect(base.locationLng).toBe(-74.006);
  });

  it('redacts lists without mutating them', () => {
    const posts = [base, { ...base, userId: 'other' }];
    const result = redactPostsLocation(posts, 'owner-id');
    expect(result[0].locationLat).toBe(40.7128); // owner's own post
    expect(result[1].locationLat).toBeNull();
    expect(posts[1].locationLat).toBe(40.7128);
  });
});

describe('Location privacy over the API', () => {
  it('hides coordinates on post detail for strangers but not the owner', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const post = await createTestPost(owner.id, { showLocation: false, privacy: 'public' });

    const asStranger = await request(app)
      .get(`/api/v1/posts/${post.id}`)
      .set('Cookie', getAuthCookie(stranger.id));
    expect(asStranger.status).toBe(200);
    expect(asStranger.body.data.post.locationLat).toBeNull();
    expect(asStranger.body.data.post.locationLng).toBeNull();
    expect(asStranger.body.data.post.locationName).toBe('New York');
    expect(asStranger.body.data.post.locationCity).toBe('New York');
    expect(asStranger.body.data.post.locationCountry).toBe('US');

    const asAnon = await request(app).get(`/api/v1/posts/${post.id}`);
    expect(asAnon.status).toBe(200);
    expect(asAnon.body.data.post.locationLat).toBeNull();

    const asOwner = await request(app)
      .get(`/api/v1/posts/${post.id}`)
      .set('Cookie', getAuthCookie(owner.id));
    expect(asOwner.status).toBe(200);
    expect(Number(asOwner.body.data.post.locationLat)).toBeCloseTo(40.7128);
    expect(Number(asOwner.body.data.post.locationLng)).toBeCloseTo(-74.006);
  });

  it('keeps coordinates visible when showLocation is true', async () => {
    const owner = await createTestUser();
    const post = await createTestPost(owner.id, { privacy: 'public' });

    const res = await request(app).get(`/api/v1/posts/${post.id}`);
    expect(res.status).toBe(200);
    expect(Number(res.body.data.post.locationLat)).toBeCloseTo(40.7128);
  });

  it('hides coordinates in the posts list for strangers', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const hidden = await createTestPost(owner.id, { showLocation: false, privacy: 'public' });

    const res = await request(app)
      .get('/api/v1/posts')
      .set('Cookie', getAuthCookie(stranger.id));
    expect(res.status).toBe(200);
    const item = (res.body.data.items as Array<{ id: string; locationLat: unknown }>).find(
      (p) => p.id === hidden.id
    );
    expect(item).toBeDefined();
    expect(item!.locationLat).toBeNull();
  });

  it('hides coordinates in the personalized feed for followers but not the owner', async () => {
    const owner = await createTestUser();
    const follower = await createTestUser();
    await prisma.follow.create({
      data: { followerId: follower.id, followingId: owner.id, status: 'accepted' },
    });
    const post = await createTestPost(owner.id, { showLocation: false, privacy: 'public' });

    const asFollower = await request(app)
      .get('/api/v1/feed')
      .set('Cookie', getAuthCookie(follower.id));
    expect(asFollower.status).toBe(200);
    const followerItem = (
      asFollower.body.data.items as Array<{ id: string; locationLat: unknown }>
    ).find((p) => p.id === post.id);
    expect(followerItem).toBeDefined();
    expect(followerItem!.locationLat).toBeNull();

    const asOwner = await request(app)
      .get('/api/v1/feed')
      .set('Cookie', getAuthCookie(owner.id));
    const ownerItem = (asOwner.body.data.items as Array<{ id: string; locationLat: unknown }>).find(
      (p) => p.id === post.id
    );
    expect(ownerItem).toBeDefined();
    expect(Number(ownerItem!.locationLat)).toBeCloseTo(40.7128);
  });

  it('excludes showLocation=false posts from map markers for everyone but the owner', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const hidden = await createTestPost(owner.id, { showLocation: false, privacy: 'public' });
    const visible = await createTestPost(owner.id, { privacy: 'public' });

    const asAnon = await request(app).get('/api/v1/map/markers');
    expect(asAnon.status).toBe(200);
    const anonIds = (asAnon.body.data.markers as Array<{ id: string }>).map((m) => m.id);
    expect(anonIds).toContain(visible.id);
    expect(anonIds).not.toContain(hidden.id);

    const asStranger = await request(app)
      .get('/api/v1/map/markers')
      .set('Cookie', getAuthCookie(stranger.id));
    const strangerIds = (asStranger.body.data.markers as Array<{ id: string }>).map((m) => m.id);
    expect(strangerIds).toContain(visible.id);
    expect(strangerIds).not.toContain(hidden.id);

    const asOwner = await request(app)
      .get('/api/v1/map/markers')
      .set('Cookie', getAuthCookie(owner.id));
    const ownerIds = (asOwner.body.data.markers as Array<{ id: string }>).map((m) => m.id);
    expect(ownerIds).toContain(visible.id);
    expect(ownerIds).toContain(hidden.id);
  });

  it('hides coordinates in explore featured content for strangers', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const hidden = await createTestPost(owner.id, {
      showLocation: false,
      privacy: 'public',
      saveCount: 50,
    });

    const res = await request(app)
      .get('/api/v1/explore/featured')
      .set('Cookie', getAuthCookie(stranger.id));
    expect(res.status).toBe(200);
    const item = (res.body.data.posts as Array<{ id: string; locationLat: unknown }>).find(
      (p) => p.id === hidden.id
    );
    expect(item).toBeDefined();
    expect(item!.locationLat).toBeNull();
  });
});
