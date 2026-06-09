'use client';

import { useActivityStream } from '@/lib/hooks/use-activity-stream';

/**
 * Keeps the activity SSE stream alive for the whole app shell so live unread
 * counts and invalidations flow on every page, not just /activity. The hook
 * is a refcounted singleton, so additional mounts share one EventSource.
 */
export function ActivityStreamMount(): null {
  useActivityStream();
  return null;
}
