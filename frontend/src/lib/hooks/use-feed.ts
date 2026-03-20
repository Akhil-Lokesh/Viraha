'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getPersonalizedFeed, getDiscoverFeed } from '../api/feed';

export function usePersonalizedFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'personal'],
    queryFn: ({ pageParam }) => getPersonalizedFeed(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useDiscoverFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'discover'],
    queryFn: ({ pageParam }) => getDiscoverFeed(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
