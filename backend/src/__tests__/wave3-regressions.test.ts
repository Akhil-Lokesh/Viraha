import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

const HOUR = 60 * 60 * 1000;

// Regression coverage for security/correctness fixes landed in the prior fix wave.
// Each block asserts the REAL current behavior of the live code (controllers +
// validators) so a future change that reintroduces the bug fails loudly.
describe('Wave 3 regression coverage', () => {
  // (a) Sealed time capsules must never leak their letter text or precise
  // coordinates, even when explicitly requested via includeSealed=true. An
  // openable capsule (openAt in the past) returns its content and coords.
  describe('Time capsule content gating (GET with includeSealed)', () => {
    it('redacts content + precise coords for sealed capsules and reveals openable ones', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const sealed = await prisma.timeCapsule.create({
        data: {
          userId: user.id,
          content: 'Sealed secret letter.',
          type: 'departure',
          locationName: 'Reykjavik',
          locationLat: 64.1466,
          locationLng: -21.9426,
          openAt: new Date(Date.now() + 7 * 24 * HOUR),
        },
      });
      const openable = await prisma.timeCapsule.create({
        data: {
          userId: user.id,
          content: 'You made it.',
          type: 'letter_to_self',
          locationName: 'Porto',
          locationLat: 41.1579,
          locationLng: -8.6291,
          openAt: new Date(Date.now() - 1 * HOUR),
        },
      });

      const res = await request(app)
        .get('/api/v1/time-capsules?includeSealed=true')
        .set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const byId = new Map<string, Record<string, unknown>>(
        res.body.data.map((c: { id: string }) => [c.id, c]),
      );

      const sealedDto = byId.get(sealed.id);
      expect(sealedDto).toBeDefined();
      // Sealed: letter text and precise coordinates must be null.
      expect(sealedDto!.content).toBeNull();
      expect(sealedDto!.locationLat).toBeNull();
      expect(sealedDto!.locationLng).toBeNull();
      // Non-sensitive metadata is still allowed through.
      expect(sealedDto!.locationName).toBe('Reykjavik');
      expect(sealedDto!.isOpened).toBe(false);
      expect(sealedDto!.isOpenable).toBe(false);

      const openableDto = byId.get(openable.id);
      expect(openableDto).toBeDefined();
      // Openable: content and numeric coordinates are revealed.
      expect(openableDto!.content).toBe('You made it.');
      expect(openableDto!.locationLat).toBeCloseTo(41.1579, 4);
      expect(openableDto!.locationLng).toBeCloseTo(-8.6291, 4);
    });
  });

  // (b) The save endpoint is a toggle, so a second normal POST unsaves rather
  // than re-saving. The invariant the idempotency fix protects is that
  // saveCount never double-increments: across repeated save/unsave cycles the
  // stored count stays bounded to {0,1} and there is never more than one Save
  // row for a (user, post) pair.
  describe('Save count never double-increments', () => {
    it('keeps saveCount bounded and the Save row unique across toggle cycles', async () => {
      const owner = await createTestUser();
      const saver = await createTestUser();
      const post = await createTestPost(owner.id);
      const cookie = getAuthCookie(saver.id);

      const save = () =>
        request(app).post(`/api/v1/posts/${post.id}/save`).set('Cookie', cookie);

      const readCount = async (): Promise<number> => {
        const row = await prisma.post.findUnique({
          where: { id: post.id },
          select: { saveCount: true },
        });
        return row!.saveCount;
      };

      const countRows = () =>
        prisma.save.count({ where: { userId: saver.id, postId: post.id } });

      // First save: row created, count -> 1.
      const first = await save();
      expect(first.status).toBe(201);
      expect(first.body.data.saved).toBe(true);
      expect(first.body.data.saveCount).toBe(1);
      expect(await readCount()).toBe(1);
      expect(await countRows()).toBe(1);

      // Second POST toggles off: count -> 0, row removed (NOT a double-increment).
      const second = await save();
      expect(second.status).toBe(200);
      expect(second.body.data.saved).toBe(false);
      expect(second.body.data.saveCount).toBe(0);
      expect(await readCount()).toBe(0);
      expect(await countRows()).toBe(0);

      // Third POST saves again: count returns to 1, still a single row.
      const third = await save();
      expect(third.status).toBe(201);
      expect(third.body.data.saved).toBe(true);
      expect(third.body.data.saveCount).toBe(1);
      expect(await readCount()).toBe(1);
      expect(await countRows()).toBe(1);
    });
  });

  // (c) Media URL validation must reject path-traversal and markup-bearing
  // values (stored-XSS / traversal vectors) while accepting a normal uploads
  // path and an https URL.
  describe('Media URL validation on createPost', () => {
    const basePost = (mediaUrl: string) => ({
      caption: 'A memory',
      mediaUrls: [mediaUrl],
      locationLat: 40.7128,
      locationLng: -74.006,
      privacy: 'public' as const,
    });

    const createWith = (mediaUrl: string, cookie: string) =>
      request(app).post('/api/v1/posts').set('Cookie', cookie).send(basePost(mediaUrl));

    it('rejects a path-traversal mediaUrl with 400', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await createWith('/uploads/../../etc/passwd', cookie);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('rejects a markup-bearing mediaUrl with 400', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await createWith('/uploads/<script>alert(1)</script>.webp', cookie);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('accepts a normal /uploads/ path', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await createWith('/uploads/abc.webp', cookie);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.mediaUrls).toContain('/uploads/abc.webp');
    });

    it('accepts an https URL', async () => {
      const user = await createTestUser();
      const cookie = getAuthCookie(user.id);

      const res = await createWith('https://cdn.example.com/photo.webp', cookie);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.post.mediaUrls).toContain('https://cdn.example.com/photo.webp');
    });
  });

  // (d) Deleting a parent comment with N live replies must decrement
  // post.commentCount by 1 + N (parent + cascaded replies) and never drop the
  // stored count below 0.
  describe('Comment count on cascading delete', () => {
    it('decrements commentCount by 1 + replyCount when deleting a parent', async () => {
      const owner = await createTestUser();
      const cookie = getAuthCookie(owner.id);
      const post = await createTestPost(owner.id);

      const postComment = (body: Record<string, unknown>) =>
        request(app)
          .post(`/api/v1/posts/${post.id}/comments`)
          .set('Cookie', cookie)
          .send(body);

      const parentRes = await postComment({ text: 'Parent comment' });
      expect(parentRes.status).toBe(201);
      const parentId = parentRes.body.data.comment.id as string;

      // Three replies under the parent => total 4 comments tracked.
      for (let i = 0; i < 3; i++) {
        const replyRes = await postComment({ text: `Reply ${i}`, parentId });
        expect(replyRes.status).toBe(201);
      }

      const before = await prisma.post.findUnique({
        where: { id: post.id },
        select: { commentCount: true },
      });
      expect(before!.commentCount).toBe(4);

      const delRes = await request(app)
        .delete(`/api/v1/comments/${parentId}`)
        .set('Cookie', cookie);
      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Parent (1) + replies (3) removed => count returns to 0.
      const after = await prisma.post.findUnique({
        where: { id: post.id },
        select: { commentCount: true },
      });
      expect(after!.commentCount).toBe(0);
    });

    it('floors commentCount at 0 when the stored count has drifted low', async () => {
      const owner = await createTestUser();
      const cookie = getAuthCookie(owner.id);
      const post = await createTestPost(owner.id);

      const postComment = (body: Record<string, unknown>) =>
        request(app)
          .post(`/api/v1/posts/${post.id}/comments`)
          .set('Cookie', cookie)
          .send(body);

      const parentRes = await postComment({ text: 'Parent' });
      const parentId = parentRes.body.data.comment.id as string;
      const replyRes = await postComment({ text: 'Reply', parentId });
      expect(replyRes.status).toBe(201);

      // Force a drift: stored count (currently 2) is lower than the 1 + N=2
      // about to be removed, so a naive subtract would go negative.
      await prisma.post.update({
        where: { id: post.id },
        data: { commentCount: 1 },
      });

      const delRes = await request(app)
        .delete(`/api/v1/comments/${parentId}`)
        .set('Cookie', cookie);
      expect(delRes.status).toBe(200);

      const after = await prisma.post.findUnique({
        where: { id: post.id },
        select: { commentCount: true },
      });
      expect(after!.commentCount).toBe(0);
      expect(after!.commentCount).toBeGreaterThanOrEqual(0);
    });
  });
});
