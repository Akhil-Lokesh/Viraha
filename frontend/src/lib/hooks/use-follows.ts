'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
  getPendingFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
} from '../api/follows';

export function useFollowStatus(userId: string) {
  return useQuery({
    queryKey: ['follows', userId, 'status'],
    queryFn: () => checkFollowStatus(userId),
    enabled: !!userId,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['follows', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unfollowUser(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['follows', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useFollowers(userId: string) {
  return useInfiniteQuery({
    queryKey: ['follows', userId, 'followers'],
    queryFn: ({ pageParam }) => getFollowers(userId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
  });
}

export function useFollowing(userId: string) {
  return useInfiniteQuery({
    queryKey: ['follows', userId, 'following'],
    queryFn: ({ pageParam }) => getFollowing(userId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId,
  });
}

export function usePendingFollowRequests(enabled = true) {
  return useInfiniteQuery({
    queryKey: ['follows', 'requests'],
    queryFn: ({ pageParam }) => getPendingFollowRequests(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

export function useAcceptFollowRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followId: string) => acceptFollowRequest(followId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useRejectFollowRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followId: string) => rejectFollowRequest(followId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
