import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The hook module imports the persisted auth store, which touches
// localStorage at module-init; stub it for the node test environment.
vi.mock('../../lib/stores/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: null }) },
}));

// EventSource bypasses the axios interceptor, so the stream manager calls the
// refresh endpoint itself before reconnecting — mock the API client module.
vi.mock('../../lib/api/client', () => ({
  default: { post: vi.fn().mockResolvedValue({ data: {} }) },
  fetchCsrfToken: vi.fn().mockResolvedValue(undefined),
}));

import apiClient, { fetchCsrfToken } from '../../lib/api/client';
import {
  createActivityStreamManager,
  createActivityInvalidator,
  resolveStreamUrl,
  useActivityStreamStore,
  ACTIVITIES_QUERY_KEY,
  UNREAD_COUNT_QUERY_KEY,
  INITIAL_BACKOFF_MS,
  MAX_BACKOFF_MS,
  MAX_REFRESH_FAILURES,
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

interface CreateManagerOverrides {
  refreshAuth?: () => Promise<boolean>;
  maxRefreshFailures?: number;
}

function createManager(overrides: CreateManagerOverrides = {}) {
  const onActivity = vi.fn<(event: unknown) => void>();
  const statuses: ActivityStreamStatus[] = [];
  const refreshAuth =
    overrides.refreshAuth ?? vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
  const manager = createActivityStreamManager({
    url: 'http://localhost:4000/api/v1/activities/stream',
    onActivity,
    onStatusChange: (status) => statuses.push(status),
    eventSourceFactory: (url) => new MockEventSource(url),
    refreshAuth,
    maxRefreshFailures: overrides.maxRefreshFailures,
  });
  return { manager, onActivity, statuses, refreshAuth };
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
    vi.mocked(apiClient.post).mockClear();
    vi.mocked(fetchCsrfToken).mockClear();
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

  it('reconnects with exponential backoff (1s doubling, 30s cap)', async () => {
    const { manager, statuses } = createManager();
    manager.start();

    // First error → reconnect after 1s
    latestSource().emit('error');
    expect(latestSource().closed).toBe(true);
    expect(statuses).toContain('reconnecting');

    await vi.advanceTimersByTimeAsync(INITIAL_BACKOFF_MS - 1);
    expect(MockEventSource.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(MockEventSource.instances).toHaveLength(2);

    // Second error → reconnect after 2s
    latestSource().emit('error');
    await vi.advanceTimersByTimeAsync(2_000 - 1);
    expect(MockEventSource.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(MockEventSource.instances).toHaveLength(3);

    // Keep failing: delays double but never exceed the 30s cap
    const expectedDelays = [4_000, 8_000, 16_000, 30_000, 30_000];
    for (const delay of expectedDelays) {
      const count = MockEventSource.instances.length;
      latestSource().emit('error');
      await vi.advanceTimersByTimeAsync(delay - 1);
      expect(MockEventSource.instances).toHaveLength(count);
      await vi.advanceTimersByTimeAsync(1);
      expect(MockEventSource.instances).toHaveLength(count + 1);
    }

    manager.stop();
  });

  it('resets backoff to 1s after a successful reconnect', async () => {
    const { manager } = createManager();
    manager.start();

    latestSource().emit('error');
    await vi.advanceTimersByTimeAsync(INITIAL_BACKOFF_MS);
    expect(MockEventSource.instances).toHaveLength(2);

    // Server confirms the connection — backoff resets
    latestSource().emit('connected');

    latestSource().emit('error');
    await vi.advanceTimersByTimeAsync(INITIAL_BACKOFF_MS);
    expect(MockEventSource.instances).toHaveLength(3);

    manager.stop();
  });

  it('attempts an auth refresh before every reconnect', async () => {
    const { manager, refreshAuth } = createManager();
    manager.start();
    expect(refreshAuth).not.toHaveBeenCalled();

    latestSource().emit('error');
    await vi.advanceTimersByTimeAsync(INITIAL_BACKOFF_MS);
    expect(refreshAuth).toHaveBeenCalledTimes(1);
    expect(MockEventSource.instances).toHaveLength(2);

    latestSource().emit('error');
    await vi.advanceTimersByTimeAsync(2_000);
    expect(refreshAuth).toHaveBeenCalledTimes(2);
    expect(MockEventSource.instances).toHaveLength(3);

    manager.stop();
  });

  it('keeps reconnecting when refresh fails fewer than the failure limit', async () => {
    const refreshAuth = vi
      .fn<() => Promise<boolean>>()
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    const { manager, statuses } = createManager({ refreshAuth });
    manager.start();

    // One refresh failure is tolerated — reconnect still happens.
    latestSource().emit('error');
    await vi.advanceTimersByTimeAsync(INITIAL_BACKOFF_MS);
    expect(MockEventSource.instances).toHaveLength(2);
    expect(statuses[statuses.length - 1]).toBe('connecting');

    manager.stop();
  });

  it('stops the stream (idle) after consecutive refresh failures', async () => {
    const refreshAuth = vi.fn<() => Promise<boolean>>().mockResolvedValue(false);
    const { manager, statuses } = createManager({ refreshAuth });
    manager.start();

    const delays = [1_000, 2_000, 4_000];
    for (const [index, delay] of delays.entries()) {
      latestSource().emit('error');
      await vi.advanceTimersByTimeAsync(delay);
      // The final failed refresh stops the stream instead of reconnecting.
      const expectedInstances = index === delays.length - 1 ? index + 1 : index + 2;
      expect(MockEventSource.instances).toHaveLength(expectedInstances);
    }

    expect(refreshAuth).toHaveBeenCalledTimes(MAX_REFRESH_FAILURES);
    expect(statuses[statuses.length - 1]).toBe('idle');

    // No further reconnect attempts — the rate limit is left alone.
    await vi.advanceTimersByTimeAsync(MAX_BACKOFF_MS * 4);
    expect(MockEventSource.instances).toHaveLength(3);
    expect(refreshAuth).toHaveBeenCalledTimes(MAX_REFRESH_FAILURES);
  });

  it('resets the refresh-failure count once the server confirms a connection', async () => {
    const refreshAuth = vi
      .fn<() => Promise<boolean>>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    const { manager, statuses } = createManager({ refreshAuth, maxRefreshFailures: 2 });
    manager.start();

    // Failure #1 (tolerated), then success — and the server confirms.
    latestSource().emit('error');
    await vi.advanceTimersByTimeAsync(1_000);
    latestSource().emit('error');
    await vi.advanceTimersByTimeAsync(2_000);
    latestSource().emit('connected');

    // Failure #1 again after the reset — still tolerated, not a stop.
    latestSource().emit('error');
    await vi.advanceTimersByTimeAsync(1_000);
    expect(statuses[statuses.length - 1]).toBe('connecting');
    expect(statuses).not.toContain('idle');

    manager.stop();
  });

  it('uses the apiClient refresh endpoint by default', async () => {
    const onActivity = vi.fn();
    const statuses: ActivityStreamStatus[] = [];
    const manager = createActivityStreamManager({
      url: 'http://localhost:4000/api/v1/activities/stream',
      onActivity,
      onStatusChange: (status) => statuses.push(status),
      eventSourceFactory: (url) => new MockEventSource(url),
    });
    manager.start();

    latestSource().emit('error');
    await vi.advanceTimersByTimeAsync(INITIAL_BACKOFF_MS);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', {});
    expect(fetchCsrfToken).toHaveBeenCalledTimes(1);
    expect(MockEventSource.instances).toHaveLength(2);

    manager.stop();
  });

  it('cleans up on stop: closes the source and cancels pending reconnects', async () => {
    const { manager, statuses, refreshAuth } = createManager();
    manager.start();
    const first = latestSource();
    first.emit('error');

    manager.stop();
    expect(statuses[statuses.length - 1]).toBe('idle');

    // A pending reconnect timer must not fire after stop
    await vi.advanceTimersByTimeAsync(MAX_BACKOFF_MS * 2);
    expect(MockEventSource.instances).toHaveLength(1);
    expect(first.closed).toBe(true);
    expect(refreshAuth).not.toHaveBeenCalled();
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
