'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getActivities, markAsRead, markAllAsRead, getUnreadCount } from '../api/activities';
import {
  ACTIVITIES_QUERY_KEY,
  UNREAD_COUNT_QUERY_KEY,
  useActivityStreamOpen,
} from './use-activity-stream';

// Polling cadence: tight 30s fallback when the SSE stream is down; relaxed
// 120s safety net while the stream is open and pushing invalidations itself.
const FALLBACK_POLL_INTERVAL_MS = 30_000;
const STREAM_OPEN_POLL_INTERVAL_MS = 120_000;

export function useActivities() {
  return useInfiniteQuery({
    queryKey: ACTIVITIES_QUERY_KEY,
    queryFn: ({ pageParam }) => getActivities(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useUnreadCount() {
  const streamOpen = useActivityStreamOpen();
  return useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: getUnreadCount,
    refetchInterval: streamOpen ? STREAM_OPEN_POLL_INTERVAL_MS : FALLBACK_POLL_INTERVAL_MS,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITIES_QUERY_KEY });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVITIES_QUERY_KEY });
    },
  });
}
