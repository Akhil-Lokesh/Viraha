import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createTestUser, createTestPost, getAuthCookie, prisma } from './factories';

describe('Reports API', () => {
  describe('POST /api/v1/reports', () => {
    it('should create a report for the happy path', async () => {
      const reporter = await createTestUser();
      const target = await createTestUser();
      const cookie = getAuthCookie(reporter.id);

      const res = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .send({
          targetType: 'user',
          targetId: target.id,
          reason: 'harassment',
          details: 'Sending abusive messages',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.report.targetType).toBe('user');
      expect(res.body.data.report.targetId).toBe(target.id);
      expect(res.body.data.report.reason).toBe('harassment');
      expect(res.body.data.report.reporterId).toBe(reporter.id);
      expect(res.body.data.report.details).toBe('Sending abusive messages');

      const rows = await prisma.report.findMany({
        where: { reporterId: reporter.id, targetType: 'user', targetId: target.id },
      });
      expect(rows.length).toBe(1);
    });

    it('should create a report for a post target without optional details', async () => {
      const owner = await createTestUser();
      const reporter = await createTestUser();
      const post = await createTestPost(owner.id);
      const cookie = getAuthCookie(reporter.id);

      const res = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .send({
          targetType: 'post',
          targetId: post.id,
          reason: 'spam',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.report.targetType).toBe('post');
      expect(res.body.data.report.targetId).toBe(post.id);
      expect(res.body.data.report.reason).toBe('spam');
      // details is optional and persisted as null when omitted
      expect(res.body.data.report.details).toBeNull();
      // status defaults to pending in the schema
      expect(res.body.data.report.status).toBe('pending');
    });

    it('should require authentication', async () => {
      const target = await createTestUser();

      const res = await request(app)
        .post('/api/v1/reports')
        .send({
          targetType: 'user',
          targetId: target.id,
          reason: 'spam',
        });

      expect(res.status).toBe(401);
    });

    it('should reject an invalid targetType', async () => {
      const reporter = await createTestUser();
      const cookie = getAuthCookie(reporter.id);

      const res = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .send({
          targetType: 'photo',
          targetId: randomUUID(),
          reason: 'spam',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject an invalid reason', async () => {
      const reporter = await createTestUser();
      const cookie = getAuthCookie(reporter.id);

      const res = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .send({
          targetType: 'post',
          targetId: randomUUID(),
          reason: 'not-a-reason',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject a non-UUID targetId', async () => {
      const reporter = await createTestUser();
      const cookie = getAuthCookie(reporter.id);

      const res = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .send({
          targetType: 'post',
          targetId: 'not-a-uuid',
          reason: 'spam',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should suppress a duplicate report from the same reporter for the same target', async () => {
      const reporter = await createTestUser();
      const target = await createTestUser();
      const cookie = getAuthCookie(reporter.id);

      const first = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .send({
          targetType: 'user',
          targetId: target.id,
          reason: 'spam',
        });

      expect(first.status).toBe(201);

      const second = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', cookie)
        .send({
          targetType: 'user',
          targetId: target.id,
          reason: 'harassment',
        });

      expect(second.status).toBe(409);
      expect(second.body.success).toBe(false);

      // Only the original report should persist — the duplicate is deduped, not stored.
      const rows = await prisma.report.findMany({
        where: { reporterId: reporter.id, targetType: 'user', targetId: target.id },
      });
      expect(rows.length).toBe(1);
      expect(rows[0].reason).toBe('spam');
    });

    it('should allow a different reporter to report the same target', async () => {
      const reporterA = await createTestUser();
      const reporterB = await createTestUser();
      const target = await createTestUser();

      const resA = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', getAuthCookie(reporterA.id))
        .send({ targetType: 'user', targetId: target.id, reason: 'spam' });

      const resB = await request(app)
        .post('/api/v1/reports')
        .set('Cookie', getAuthCookie(reporterB.id))
        .send({ targetType: 'user', targetId: target.id, reason: 'inappropriate' });

      expect(resA.status).toBe(201);
      expect(resB.status).toBe(201);

      const rows = await prisma.report.findMany({
        where: { targetType: 'user', targetId: target.id },
      });
      expect(rows.length).toBe(2);
    });
  });
});
