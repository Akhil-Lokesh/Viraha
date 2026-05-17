'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserByUsername, searchUsers, blockUser, unblockUser, getBlockedUsers } from '../api/users';

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['users', username],
    queryFn: () => getUserByUsername(username),
    enabled: !!username,
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['users', 'search', query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 2,
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['users', 'blocks'],
    queryFn: () => getBlockedUsers(),
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'blocks'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      queryClient.invalidateQueries({ queryKey: ['follows'] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'blocks'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
    },
  });
}
