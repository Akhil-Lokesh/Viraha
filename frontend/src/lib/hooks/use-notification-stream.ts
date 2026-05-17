'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';

const STREAM_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api/v1';

const STREAM_URL = `${STREAM_BASE}/notifications/stream`;

const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

export function useNotificationStream(): void {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const sourceRef = useRef<EventSource | null>(null);
  const backoffRef = useRef<number>(INITIAL_BACKOFF_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    stoppedRef.current = false;
    backoffRef.current = INITIAL_BACKOFF_MS;

    const connect = () => {
      if (stoppedRef.current) return;

      const source = new EventSource(STREAM_URL, { withCredentials: true });
      sourceRef.current = source;

      source.addEventListener('open', () => {
        backoffRef.current = INITIAL_BACKOFF_MS;
      });

      source.addEventListener('activity', () => {
        queryClient.invalidateQueries({ queryKey: ['activities'] });
        queryClient.invalidateQueries({ queryKey: ['activities', 'unread'] });
      });

      source.addEventListener('error', () => {
        source.close();
        sourceRef.current = null;
        if (stoppedRef.current) return;
        const delay = Math.min(backoffRef.current, MAX_BACKOFF_MS);
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
        reconnectTimerRef.current = setTimeout(connect, delay);
      });
    };

    connect();

    return () => {
      stoppedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, queryClient]);
}
