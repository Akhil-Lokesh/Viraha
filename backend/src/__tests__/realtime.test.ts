import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { Response } from 'express';
import app from '../app';
import { createTestUser, prisma } from './factories';
import {
  registerConnection,
  deregisterConnection,
  getConnectionCount,
  publishActivity,
  shutdownRealtime,
} from '../lib/realtime';
import { createActivity } from '../utils/activity';

function makeFake(): { res: Response; written: string[]; isEnded: () => boolean } {
  const written: string[] = [];
  let ended = false;
  const fake = {
    write(chunk: string): boolean {
      written.push(chunk);
      return true;
    },
    end(): void {
      ended = true;
    },
  };
  return { res: fake as unknown as Response, written, isEnded: () => ended };
}

afterEach(() => {
  shutdownRealtime();
});

describe('Realtime (SSE)', () => {
  describe('GET /api/v1/activities/stream', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/activities/stream');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('connection registry', () => {
    it('registers and deregisters connections', () => {
      const { res } = makeFake();
      registerConnection('user-1', res);
      expect(getConnectionCount('user-1')).toBe(1);

      deregisterConnection('user-1', res);
      expect(getConnectionCount('user-1')).toBe(0);
    });

    it('caps connections at 5 per user, closing the oldest', () => {
      const conns = Array.from({ length: 6 }, () => makeFake());
      for (const conn of conns) {
        registerConnection('user-cap', conn.res);
      }

      expect(getConnectionCount('user-cap')).toBe(5);
      expect(conns[0].isEnded()).toBe(true);
      expect(conns[5].isEnded()).toBe(false);
    });
  });

  describe('publishActivity', () => {
    it('delivers an activity event to a registered connection', async () => {
      const { res, written } = makeFake();
      registerConnection('user-pub', res);

      await publishActivity('user-pub', { type: 'comment', actorId: 'actor-1' });

      expect(written.length).toBe(1);
      expect(written[0]).toContain('event: activity\n');
      const dataLine = written[0].split('\n').find((line) => line.startsWith('data: '));
      expect(dataLine).toBeDefined();
      const payload = JSON.parse((dataLine as string).slice('data: '.length)) as Record<
        string,
        unknown
      >;
      expect(payload.type).toBe('comment');
      expect(payload.actorId).toBe('actor-1');
    });

    it('does not deliver to other users', async () => {
      const target = makeFake();
      const other = makeFake();
      registerConnection('user-a', target.res);
      registerConnection('user-b', other.res);

      await publishActivity('user-a', { type: 'follow' });

      expect(target.written.length).toBe(1);
      expect(other.written.length).toBe(0);
    });

    it('does not throw when no connections are registered', async () => {
      await expect(
        publishActivity('nobody-listening', { type: 'save' })
      ).resolves.toBeUndefined();
    });
  });

  describe('createActivity integration', () => {
    it('publishes a realtime event after persisting the activity', async () => {
      const recipient = await createTestUser();
      const actor = await createTestUser();
      const { res, written } = makeFake();
      registerConnection(recipient.id, res);

      await createActivity({
        userId: recipient.id,
        actorId: actor.id,
        type: 'follow',
      });

      const row = await prisma.activity.findFirst({
        where: { userId: recipient.id, actorId: actor.id, type: 'follow' },
      });
      expect(row).not.toBeNull();

      expect(written.length).toBe(1);
      const dataLine = written[0].split('\n').find((line) => line.startsWith('data: '));
      const payload = JSON.parse((dataLine as string).slice('data: '.length)) as Record<
        string,
        unknown
      >;
      expect(payload.type).toBe('follow');
      expect(payload.actorId).toBe(actor.id);
      expect(payload.postId).toBeNull();
      expect(payload.commentId).toBeNull();
      expect(typeof payload.createdAt).toBe('string');
    });

    it('does not publish for self-activity', async () => {
      const user = await createTestUser();
      const { res, written } = makeFake();
      registerConnection(user.id, res);

      await createActivity({ userId: user.id, actorId: user.id, type: 'follow' });

      expect(written.length).toBe(0);
      const count = await prisma.activity.count({ where: { userId: user.id } });
      expect(count).toBe(0);
    });
  });

  describe('shutdownRealtime', () => {
    it('closes all registered connections and empties the registry', () => {
      const a = makeFake();
      const b = makeFake();
      registerConnection('user-x', a.res);
      registerConnection('user-y', b.res);

      shutdownRealtime();

      expect(a.isEnded()).toBe(true);
      expect(b.isEnded()).toBe(true);
      expect(getConnectionCount('user-x')).toBe(0);
      expect(getConnectionCount('user-y')).toBe(0);
    });
  });
});
