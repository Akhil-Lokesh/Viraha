'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  getAlbums,
  getAlbumById,
  getAlbumBySlug,
  getAlbumPosts,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  addPostToAlbum,
  removePostFromAlbum,
} from '../api/albums';
import type { CreateAlbumInput, UpdateAlbumInput } from '../types';

export function useAlbums(userId?: string) {
  return useInfiniteQuery({
    queryKey: ['albums', userId],
    queryFn: ({ pageParam }) => getAlbums(pageParam as string | undefined, userId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: ['albums', id],
    queryFn: () => getAlbumById(id),
    enabled: !!id,
  });
}

export function useAlbumBySlug(slug: string) {
  return useQuery({
    queryKey: ['albums', 'slug', slug],
    queryFn: () => getAlbumBySlug(slug),
    enabled: !!slug,
  });
}

export function useAlbumPosts(albumId: string) {
  return useInfiniteQuery({
    queryKey: ['albums', albumId, 'posts'],
    queryFn: ({ pageParam }) => getAlbumPosts(albumId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!albumId,
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAlbumInput) => createAlbum(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAlbumInput }) => updateAlbum(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAlbum(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

export function useAddPostToAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, postId }: { albumId: string; postId: string }) =>
      addPostToAlbum(albumId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}

export function useRemovePostFromAlbum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, postId }: { albumId: string; postId: string }) =>
      removePostFromAlbum(albumId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
  });
}
