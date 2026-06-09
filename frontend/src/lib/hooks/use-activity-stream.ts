'use client';

import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { useAuthStore } from '../stores/auth-store';

/**
 * Query keys shared with use-activities.ts (single source of truth — that
 * module imports these so the stream invalidations always hit the live keys).
 */
export const ACTIVITIES_QUERY_KEY = ['activities'] as const;
export const UNREAD_COUNT_QUERY_KEY = ['activities', 'unread'] as const;

const STREAM_PATH = '/activities/stream';
export const INITIAL_BACKOFF_MS = 1_000;
export const MAX_BACKOFF_MS = 30_000;

export type ActivityStreamStatus = 'idle' | 'connecting' | 'open' | 'reconnecting';

export interface ActivityStreamEvent {
  type: string;
  actorId: string;
  postId?: string;
  commentId?: string;
  createdAt: string;
}

/** Minimal EventSource surface so tests can inject a mock implementation. */
export interface EventSourceLike {
  addEventListener(type: string, listener: (event: { data?: unknown }) => void): void;
  close(): void;
}

export type EventSourceFactory = (url: string) => EventSourceLike;

export interface ActivityStreamManagerOptions {
  url: string;
  onActivity: (event: ActivityStreamEvent) => void;
  onStatusChange: (status: ActivityStreamStatus) => void;
  eventSourceFactory?: EventSourceFactory;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
}

export interface ActivityStreamManager {
  start: () => void;
  stop: () => void;
}

/** Resolves the SSE endpoint from the same env var the API client uses. */
export function resolveStreamUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  return `${base.replace(/\/+$/, '')}${STREAM_PATH}`;
}

function defaultEventSourceFactory(url: string): EventSourceLike {
  return new EventSource(url, { withCredentials: true });
}

/**
 * Framework-agnostic SSE connection manager: connects, surfaces status,
 * parses `activity` events, and reconnects with exponential backoff
 * (1s doubling to a 30s cap). Backoff resets once the server confirms
 * the connection via its `connected` event.
 */
export function createActivityStreamManager(
  options: ActivityStreamManagerOptions
): ActivityStreamManager {
  const {
    url,
    onActivity,
    onStatusChange,
    eventSourceFactory = defaultEventSourceFactory,
    initialBackoffMs = INITIAL_BACKOFF_MS,
    maxBackoffMs = MAX_BACKOFF_MS,
  } = options;

  let source: EventSourceLike | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let backoffMs = initialBackoffMs;
  let stopped = false;

  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function connect(): void {
    if (stopped) return;
    onStatusChange('connecting');
    const current = eventSourceFactory(url);
    source = current;

    current.addEventListener('connected', () => {
      if (stopped || source !== current) return;
      backoffMs = initialBackoffMs;
      onStatusChange('open');
    });

    current.addEventListener('activity', (event) => {
      if (stopped || source !== current) return;
      if (typeof event.data !== 'string') return;
      try {
        onActivity(JSON.parse(event.data) as ActivityStreamEvent);
      } catch {
        // Malformed payload — ignore; the polling fallback still refreshes state.
      }
    });

    current.addEventListener('error', () => {
      if (stopped || source !== current) return;
      current.close();
      source = null;
      onStatusChange('reconnecting');
      const delay = backoffMs;
      backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
      clearReconnectTimer();
      reconnectTimer = setTimeout(connect, delay);
    });
  }

  return {
    start: () => {
      if (source !== null || reconnectTimer !== null) return;
      stopped = false;
      backoffMs = initialBackoffMs;
      connect();
    },
    stop: () => {
      stopped = true;
      clearReconnectTimer();
      source?.close();
      source = null;
      onStatusChange('idle');
    },
  };
}

/**
 * Builds the invalidation callback the stream fires on each `activity` event.
 * Exported separately so tests can verify the exact keys without rendering.
 */
export function createActivityInvalidator(
  queryClient: Pick<QueryClient, 'invalidateQueries'>
): () => void {
  return () => {
    void queryClient.invalidateQueries({ queryKey: ACTIVITIES_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
  };
}

interface ActivityStreamState {
  status: ActivityStreamStatus;
  setStatus: (status: ActivityStreamStatus) => void;
}

/** Shared stream status — use-activities reads this to relax its polling. */
export const useActivityStreamStore = create<ActivityStreamState>((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
}));

/** True while the SSE stream is open (real-time invalidations flowing). */
export function useActivityStreamOpen(): boolean {
  return useActivityStreamStore((state) => state.status === 'open');
}

// Module-level singleton so multiple mounts (page + future layout adoption,
// StrictMode double-effects) share one connection instead of opening several.
let sharedManager: ActivityStreamManager | null = null;
let mountCount = 0;

function acquireStream(queryClient: QueryClient): void {
  mountCount += 1;
  if (sharedManager) return;
  sharedManager = createActivityStreamManager({
    url: resolveStreamUrl(),
    onActivity: createActivityInvalidator(queryClient),
    onStatusChange: (status) => useActivityStreamStore.getState().setStatus(status),
  });
  sharedManager.start();
}

function releaseStream(): void {
  mountCount = Math.max(0, mountCount - 1);
  if (mountCount === 0 && sharedManager) {
    sharedManager.stop();
    sharedManager = null;
  }
}

/**
 * Subscribes to the backend activity SSE stream (cookie-authenticated) while
 * the user is logged in. Safe to mount in multiple places — a refcounted
 * singleton keeps exactly one EventSource alive. Returns the stream status.
 */
export function useActivityStream(): ActivityStreamStatus {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => !!state.user);
  const status = useActivityStreamStore((state) => state.status);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      return undefined;
    }
    acquireStream(queryClient);
    return releaseStream;
  }, [isAuthenticated, queryClient]);

  return status;
}
