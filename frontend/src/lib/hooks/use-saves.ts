'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toggleSave, checkSaveStatus, getSavedPosts } from '../api/saves';

export function useSaveStatus(postId: string) {
  return useQuery({
    queryKey: ['saves', postId, 'status'],
    queryFn: () => checkSaveStatus(postId),
    enabled: !!postId,
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => toggleSave(postId),
    onSuccess: (_, postId) => {
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
