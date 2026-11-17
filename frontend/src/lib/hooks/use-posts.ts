'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery, type QueryClient } from '@tanstack/react-query';
import { getPosts, getPostById, createPost, updatePost, deletePost, searchPosts } from '../api/posts';
import type { CreatePostInput, UpdatePostInput } from '../types';

export function usePostsFeed() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => getPosts(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/**
 * Current user's OWN posts. Used by the home hero ("your latest memory") so a
 * new user never sees a stranger's feed post mislabelled as their own entry.
 */
export function useMyPosts(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['posts', 'by-user', userId],
    queryFn: ({ pageParam }) => getPosts(pageParam as string | undefined, userId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
  });
}

// Everything that renders posts or numbers derived from them.
const POST_DERIVED_KEYS = ['posts', 'feed', 'explore', 'map-markers', 'atlas', 'users', 'albums', 'saves', 'journeys'] as const;

function invalidatePostDerived(queryClient: QueryClient): Promise<void[]> {
  return Promise.all(POST_DERIVED_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: () => getPostById(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostInput) => createPost(data),
    onSuccess: () => invalidatePostDerived(queryClient),
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostInput }) =>
      updatePost(id, data),
    onSuccess: () => invalidatePostDerived(queryClient),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: (_, id) => {
      // The detail page is navigating away; don't let it refetch a 404.
      queryClient.removeQueries({ queryKey: ['posts', id], exact: true });
      return invalidatePostDerived(queryClient);
    },
  });
}

export function useSearchPosts(query: string) {
  return useInfiniteQuery({
    queryKey: ['posts', 'search', query],
    queryFn: ({ pageParam }) => searchPosts(query, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: query.length > 0,
  });
}
