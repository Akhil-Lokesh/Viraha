import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The hook module imports the persisted auth store, which touches
// localStorage at module-init; stub it for the node test environment.
vi.mock('../../lib/stores/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: null }) },
}));

import {
  createActivityStreamManager,
  createActivityInvalidator,
  resolveStreamUrl,
  useActivityStreamStore,
  ACTIVITIES_QUERY_KEY,
  UNREAD_COUNT_QUERY_KEY,
  INITIAL_BACKOFF_MS,
  MAX_BACKOFF_MS,
  type ActivityStreamStatus,
  type EventSourceLike,
} from '../../lib/hooks/use-activity-stream';

type Listener = (event: { data?: unknown }) => void;

class MockEventSource implements EventSourceLike {
  static instances: MockEventSource[] = [];

  readonly url: string;
  closed = false;
  private listeners = new Map<string, Listener[]>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  close(): void {
    this.closed = true;
  }

  emit(type: string, data?: unknown): void {
    (this.listeners.get(type) ?? []).forEach((listener) => listener({ data }));
  }
}

function createManager() {
  const onActivity = vi.fn<(event: unknown) => void>();
  const statuses: ActivityStreamStatus[] = [];
  const manager = createActivityStreamManager({
    url: 'http://localhost:4000/api/v1/activities/stream',
    onActivity,
    onStatusChange: (status) => statuses.push(status),
    eventSourceFactory: (url) => new MockEventSource(url),
  });
  return { manager, onActivity, statuses };
}

function latestSource(): MockEventSource {
  const source = MockEventSource.instances[MockEventSource.instances.length - 1];
  expect(source).toBeDefined();
  return source;
}

describe('resolveStreamUrl', () => {
  it('builds the SSE endpoint from NEXT_PUBLIC_API_URL', () => {
    // setup.ts pins NEXT_PUBLIC_API_URL to http://localhost:4000/api/v1
    expect(resolveStreamUrl()).toBe('http://localhost:4000/api/v1/activities/stream');
  });
});

describe('createActivityStreamManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockEventSource.instances = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('connects and reports open on the connected event', () => {
    const { manager, statuses } = createManager();
    manager.start();

    expect(MockEventSource.instances).toHaveLength(1);
    expect(latestSource().url).toBe('http://localhost:4000/api/v1/activities/stream');
    expect(statuses).toEqual(['connecting']);

    latestSource().emit('connected');
    expect(statuses).toEqual(['connecting', 'open']);

    manager.stop();
  });

  it('parses activity events and forwards them to onActivity', () => {
    const { manager, onActivity } = createManager();
    manager.start();
    latestSource().emit('connected');

    const payload = {
      type: 'comment',
      actorId: 'user-1',
      postId: 'post-1',
      createdAt: '2026-06-09T10:00:00Z',
    };
    latestSource().emit('activity', JSON.stringify(payload));

    expect(onActivity).toHaveBeenCalledTimes(1);
    expect(onActivity).toHaveBeenCalledWith(payload);

    manager.stop();
  });

  it('ignores malformed activity payloads without throwing', () => {
    const { manager, onActivity } = createManager();
    manager.start();
    latestSource().emit('connected');

    expect(() => latestSource().emit('activity', 'not-json{')).not.toThrow();
    expect(() => latestSource().emit('activity', undefined)).not.toThrow();
    expect(onActivity).not.toHaveBeenCalled();

    manager.stop();
  });

  it('reconnects with exponential backoff (1s doubling, 30s cap)', () => {
    const { manager, statuses } = createManager();
    manager.start();

    // First error → reconnect after 1s
    latestSource().emit('error');
    expect(latestSource().closed).toBe(true);
    expect(statuses).toContain('reconnecting');

    vi.advanceTimersByTime(INITIAL_BACKOFF_MS - 1);
    expect(MockEventSource.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(MockEventSource.instances).toHaveLength(2);

    // Second error → reconnect after 2s
    latestSource().emit('error');
    vi.advanceTimersByTime(2_000 - 1);
    expect(MockEventSource.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(MockEventSource.instances).toHaveLength(3);

    // Keep failing: delays double but never exceed the 30s cap
    const expectedDelays = [4_000, 8_000, 16_000, 30_000, 30_000];
    expectedDelays.forEach((delay) => {
      const count = MockEventSource.instances.length;
      latestSource().emit('error');
      vi.advanceTimersByTime(delay - 1);
      expect(MockEventSource.instances).toHaveLength(count);
      vi.advanceTimersByTime(1);
      expect(MockEventSource.instances).toHaveLength(count + 1);
    });

    manager.stop();
  });

  it('resets backoff to 1s after a successful reconnect', () => {
    const { manager } = createManager();
    manager.start();

    latestSource().emit('error');
    vi.advanceTimersByTime(INITIAL_BACKOFF_MS);
    expect(MockEventSource.instances).toHaveLength(2);

    // Server confirms the connection — backoff resets
    latestSource().emit('connected');

    latestSource().emit('error');
    vi.advanceTimersByTime(INITIAL_BACKOFF_MS);
    expect(MockEventSource.instances).toHaveLength(3);

    manager.stop();
  });

  it('cleans up on stop: closes the source and cancels pending reconnects', () => {
    const { manager, statuses } = createManager();
    manager.start();
    const first = latestSource();
    first.emit('error');

    manager.stop();
    expect(statuses[statuses.length - 1]).toBe('idle');

    // A pending reconnect timer must not fire after stop
    vi.advanceTimersByTime(MAX_BACKOFF_MS * 2);
    expect(MockEventSource.instances).toHaveLength(1);
    expect(first.closed).toBe(true);
  });

  it('closes the open source on stop and ignores late events', () => {
    const { manager, onActivity } = createManager();
    manager.start();
    const source = latestSource();
    source.emit('connected');

    manager.stop();
    expect(source.closed).toBe(true);

    source.emit('activity', JSON.stringify({ type: 'follow', actorId: 'x', createdAt: 'now' }));
    expect(onActivity).not.toHaveBeenCalled();
  });

  it('start is idempotent while a connection is live', () => {
    const { manager } = createManager();
    manager.start();
    manager.start();
    expect(MockEventSource.instances).toHaveLength(1);
    manager.stop();
  });
});

describe('createActivityInvalidator', () => {
  it('invalidates the activities and unread-count query keys', () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const invalidate = createActivityInvalidator({ invalidateQueries });

    invalidate();

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ACTIVITIES_QUERY_KEY });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: UNREAD_COUNT_QUERY_KEY });
  });
});

describe('useActivityStreamStore', () => {
  it('tracks stream status for the polling fallback', () => {
    expect(useActivityStreamStore.getState().status).toBe('idle');
    useActivityStreamStore.getState().setStatus('open');
    expect(useActivityStreamStore.getState().status).toBe('open');
    useActivityStreamStore.getState().setStatus('idle');
  });
});
