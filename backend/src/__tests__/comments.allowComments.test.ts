import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

/**
 * Per-post comment moderation:
 *   - Author can disable comments via PATCH /posts/:id { allowComments: false }
 *   - createComment returns 403 COMMENTS_DISABLED when allowComments is false
 *   - getComments still returns existing comments on a disabled post
 *   - Re-enabling restores create access
 */
describe('Per-post comment moderation', () => {
  it('PATCH /posts/:id { allowComments } persists the flag and toggles back', async () => {
    const owner = await createTestUser();
    const post = await createTestPost(owner.id);
    expect(post.allowComments).toBe(true);

    const disableRes = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set('Cookie', [getAuthCookie(owner.id)])
      .send({ allowComments: false });

    expect(disableRes.status).toBe(200);

    let after = await prisma.post.findUnique({ where: { id: post.id } });
    expect(after!.allowComments).toBe(false);

    const enableRes = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set('Cookie', [getAuthCookie(owner.id)])
      .send({ allowComments: true });

    expect(enableRes.status).toBe(200);
    after = await prisma.post.findUnique({ where: { id: post.id } });
    expect(after!.allowComments).toBe(true);
  });

  it('rejects createComment with 403 COMMENTS_DISABLED when allowComments is false', async () => {
    const owner = await createTestUser();
    const commenter = await createTestUser();
    const post = await createTestPost(owner.id, { allowComments: false });

    const res = await request(app)
      .post(`/api/v1/posts/${post.id}/comments`)
      .set('Cookie', [getAuthCookie(commenter.id)])
      .send({ text: 'hello' });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('COMMENTS_DISABLED');

    const created = await prisma.comment.findMany({ where: { postId: post.id } });
    expect(created).toHaveLength(0);
  });

  it('also rejects the post owner when comments are disabled', async () => {
    const owner = await createTestUser();
    const post = await createTestPost(owner.id, { allowComments: false });

    const res = await request(app)
      .post(`/api/v1/posts/${post.id}/comments`)
      .set('Cookie', [getAuthCookie(owner.id)])
      .send({ text: 'self-reply' });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe('COMMENTS_DISABLED');
  });

  it('still returns existing comments on a disabled post', async () => {
    const owner = await createTestUser();
    const commenter = await createTestUser();
    const post = await createTestPost(owner.id);

    // Create a comment while enabled
    await request(app)
      .post(`/api/v1/posts/${post.id}/comments`)
      .set('Cookie', [getAuthCookie(commenter.id)])
      .send({ text: 'before disable' });

    // Disable
    await prisma.post.update({ where: { id: post.id }, data: { allowComments: false } });

    const readRes = await request(app)
      .get(`/api/v1/posts/${post.id}/comments`)
      .set('Cookie', [getAuthCookie(commenter.id)]);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.items).toHaveLength(1);
    expect(readRes.body.data.items[0].text).toBe('before disable');
  });

  it('non-owner cannot toggle allowComments', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const post = await createTestPost(owner.id);

    const res = await request(app)
      .patch(`/api/v1/posts/${post.id}`)
      .set('Cookie', [getAuthCookie(other.id)])
      .send({ allowComments: false });

    expect(res.status).toBe(403);
    const after = await prisma.post.findUnique({ where: { id: post.id } });
    expect(after!.allowComments).toBe(true);
  });
});
