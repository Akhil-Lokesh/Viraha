'use client';

import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { createComment, getComments, getReplies, updateComment, deleteComment } from '../api/comments';
import type { CreateCommentInput, UpdateCommentInput } from '../types';

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }) => getComments(postId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!postId,
  });
}

export function useReplies(commentId: string) {
  return useInfiniteQuery({
    queryKey: ['replies', commentId],
    queryFn: ({ pageParam }) => getReplies(commentId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!commentId,
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCommentInput) => createComment(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['posts', postId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentInput }) =>
      updateComment(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      // Replies are cached under ['replies', parentId]. The mutation context does
      // not carry the parentId, so invalidate the whole 'replies' prefix to ensure
      // an edited reply re-fetches its updated body instead of showing stale data.
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // Replies are cached under ['replies', parentId]; invalidate the prefix so a
      // deleted reply is removed from its parent's replies list.
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });
}
