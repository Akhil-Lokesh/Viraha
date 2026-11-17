'use client';

import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toggleSave, getSavedPosts } from '../api/saves';

export function useToggleSave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => toggleSave(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saves'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useSavedPosts() {
  return useInfiniteQuery({
    queryKey: ['saves', 'list'],
    queryFn: ({ pageParam }) => getSavedPosts(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
