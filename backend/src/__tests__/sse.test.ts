import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import * as sseRegistry from '../lib/sseRegistry';
import { createTestUser, getAuthCookie } from './factories';

describe('SSE notifications — GET /api/v1/notifications/stream', () => {
  beforeEach(() => {
    sseRegistry._resetRegistry();
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/v1/notifications/stream');
    expect(res.status).toBe(401);
  });

  it('opens with SSE headers and registers the listener', async () => {
    const user = await createTestUser();

    // Build a manual aborted request: we just need the response headers, not the stream.
    const res = await new Promise<{ status: number; headers: Record<string, string> }>(
      (resolve, reject) => {
        const req = request(app)
          .get('/api/v1/notifications/stream')
          .set('Cookie', getAuthCookie(user.id))
          .buffer(false)
          .parse((response, _cb) => {
            resolve({
              status: response.statusCode,
              headers: response.headers as Record<string, string>,
            });
            (response as unknown as { destroy?: () => void }).destroy?.();
          });
        req.on('error', (err: NodeJS.ErrnoException) => {
          // Aborting the response throws — that's expected once we've captured headers.
          if (err.code === 'ECONNRESET' || err.code === 'ABORTED') return;
          reject(err);
        });
        req.end(() => {});
      }
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.headers['cache-control']).toContain('no-cache');
  });
});

describe('sseRegistry.push()', () => {
  beforeEach(() => {
    sseRegistry._resetRegistry();
  });

  it('writes a valid SSE frame to registered listeners', () => {
    const writes: string[] = [];
    const fakeRes = {
      writableEnded: false,
      destroyed: false,
      write: (chunk: string) => {
        writes.push(chunk);
        return true;
      },
    } as unknown as import('express').Response;

    sseRegistry.register('user-1', fakeRes);
    sseRegistry.push('user-1', 'activity', { id: 'a', type: 'like' });

    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatch(/^event: activity\n/);
    expect(writes[0]).toContain('data: {"id":"a","type":"like"}');
    expect(writes[0].endsWith('\n\n')).toBe(true);
  });

  it('drops listeners that have already ended', () => {
    const fakeRes = {
      writableEnded: true,
      destroyed: false,
      write: () => true,
    } as unknown as import('express').Response;

    sseRegistry.register('user-2', fakeRes);
    expect(sseRegistry.listenerCount('user-2')).toBe(1);
    sseRegistry.push('user-2', 'activity', { id: 'x' });
    expect(sseRegistry.listenerCount('user-2')).toBe(0);
  });

  it('is a no-op when no listeners are registered for the user', () => {
    expect(() => sseRegistry.push('ghost', 'activity', {})).not.toThrow();
  });
});
