import { describe, it, expect, afterEach, vi } from 'vitest';
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

  describe('publishActivity with Redis (subscriber warm-up and recovery)', () => {
    type RealtimeModule = typeof import('../lib/realtime');
    type Handler = (...args: unknown[]) => void;

    interface FakeSubscriber {
      on: (event: string, cb: Handler) => FakeSubscriber;
      subscribe: ReturnType<typeof vi.fn>;
      disconnect: ReturnType<typeof vi.fn>;
      confirmSubscribe: () => void;
      failSubscribe: (err: Error) => void;
      emitMessage: (channel: string, message: string) => void;
      emitEnd: () => void;
    }

    function makeFakeRedis() {
      const subscribers: FakeSubscriber[] = [];
      const publish = vi.fn().mockResolvedValue(1);

      function makeSub(): FakeSubscriber {
        const handlers = new Map<string, Handler>();
        let resolveSubscribe!: (value: unknown) => void;
        let rejectSubscribe!: (err: Error) => void;
        const subscribePromise = new Promise((resolve, reject) => {
          resolveSubscribe = resolve;
          rejectSubscribe = reject;
        });
        const sub: FakeSubscriber = {
          on(event: string, cb: Handler) {
            handlers.set(event, cb);
            return sub;
          },
          subscribe: vi.fn(() => subscribePromise),
          disconnect: vi.fn(),
          confirmSubscribe: () => resolveSubscribe(1),
          failSubscribe: (err: Error) => rejectSubscribe(err),
          emitMessage: (channel: string, message: string) =>
            handlers.get('message')?.(channel, message),
          emitEnd: () => handlers.get('end')?.(),
        };
        return sub;
      }

      const fakeRedis = {
        duplicate: vi.fn(() => {
          const sub = makeSub();
          subscribers.push(sub);
          return sub;
        }),
        publish,
      };
      return { fakeRedis, publish, subscribers };
    }

    async function loadRealtimeWithRedis(fakeRedis: unknown): Promise<RealtimeModule> {
      vi.resetModules();
      vi.doMock('../lib/redis', () => ({ redis: fakeRedis }));
      return import('../lib/realtime');
    }

    afterEach(() => {
      vi.doUnmock('../lib/redis');
      vi.resetModules();
      vi.useRealTimers();
    });

    it('delivers via the subscriber only (no local fallback) once subscription is confirmed', async () => {
      const { fakeRedis, publish, subscribers } = makeFakeRedis();
      const realtime = await loadRealtimeWithRedis(fakeRedis);
      const { res, written } = makeFake();
      realtime.registerConnection('u1', res);

      const pending = realtime.publishActivity('u1', { type: 'comment' });
      // Subscription confirms during the warm-up window, before the timeout.
      subscribers[0].confirmSubscribe();
      await pending;

      // No direct local delivery — the Redis subscriber is the single path.
      expect(written).toHaveLength(0);
      expect(publish).toHaveBeenCalledTimes(1);

      // Simulate the Redis server delivering the published message back.
      subscribers[0].emitMessage(
        'viraha:activity',
        JSON.stringify({ userId: 'u1', payload: { type: 'comment' } })
      );
      expect(written).toHaveLength(1);

      realtime.shutdownRealtime();
    });

    it('delivers exactly once locally when the warm-up window times out, and tears the pending subscriber down', async () => {
      vi.useFakeTimers();
      const { fakeRedis, publish, subscribers } = makeFakeRedis();
      const realtime = await loadRealtimeWithRedis(fakeRedis);
      const { res, written } = makeFake();
      realtime.registerConnection('u1', res);

      const pending = realtime.publishActivity('u1', { type: 'comment' });
      // Subscription never confirms within the warm-up window.
      await vi.advanceTimersByTimeAsync(600);
      await pending;

      expect(written).toHaveLength(1);
      // Still published for OTHER instances' subscribers.
      expect(publish).toHaveBeenCalledTimes(1);
      // The pending subscriber was torn down so a late confirmation can never
      // deliver this event a second time.
      expect(subscribers[0].disconnect).toHaveBeenCalled();

      // A late confirmation must not resurrect the dead subscriber...
      subscribers[0].confirmSubscribe();
      // ...and the next publish re-subscribes from scratch.
      const second = realtime.publishActivity('u1', { type: 'follow' });
      expect(fakeRedis.duplicate).toHaveBeenCalledTimes(2);
      subscribers[1].confirmSubscribe();
      await second;
      // Second event went via Redis only — still exactly one local write.
      expect(written).toHaveLength(1);

      realtime.shutdownRealtime();
    });

    it('delivers exactly once locally when the subscription fails', async () => {
      const { fakeRedis, subscribers } = makeFakeRedis();
      const realtime = await loadRealtimeWithRedis(fakeRedis);
      const { res, written } = makeFake();
      realtime.registerConnection('u1', res);

      const pending = realtime.publishActivity('u1', { type: 'save' });
      subscribers[0].failSubscribe(new Error('subscribe refused'));
      await pending;

      expect(written).toHaveLength(1);
      expect(subscribers[0].disconnect).toHaveBeenCalled();

      realtime.shutdownRealtime();
    });

    it('delivers locally when the Redis publish fails even though the subscription is confirmed', async () => {
      const { fakeRedis, publish, subscribers } = makeFakeRedis();
      publish.mockRejectedValueOnce(new Error('redis down'));
      const realtime = await loadRealtimeWithRedis(fakeRedis);
      const { res, written } = makeFake();
      realtime.registerConnection('u1', res);

      const pending = realtime.publishActivity('u1', { type: 'comment' });
      subscribers[0].confirmSubscribe();
      await pending;

      expect(written).toHaveLength(1);

      realtime.shutdownRealtime();
    });

    it('re-subscribes after the subscriber connection ends (cross-instance delivery recovers)', async () => {
      const { fakeRedis, publish, subscribers } = makeFakeRedis();
      const realtime = await loadRealtimeWithRedis(fakeRedis);
      const { res, written } = makeFake();
      realtime.registerConnection('u1', res);

      const first = realtime.publishActivity('u1', { type: 'comment' });
      subscribers[0].confirmSubscribe();
      await first;
      expect(fakeRedis.duplicate).toHaveBeenCalledTimes(1);

      // Connection drops for good — state must reset, not stay dead forever.
      subscribers[0].emitEnd();
      expect(subscribers[0].disconnect).toHaveBeenCalled();

      const second = realtime.publishActivity('u1', { type: 'follow' });
      expect(fakeRedis.duplicate).toHaveBeenCalledTimes(2);
      subscribers[1].confirmSubscribe();
      await second;

      // Both events went via Redis pub/sub; the new subscriber delivers.
      expect(publish).toHaveBeenCalledTimes(2);
      expect(written).toHaveLength(0);
      subscribers[1].emitMessage(
        'viraha:activity',
        JSON.stringify({ userId: 'u1', payload: { type: 'follow' } })
      );
      expect(written).toHaveLength(1);

      realtime.shutdownRealtime();
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
