'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { muteUser, unmuteUser, getMutedUsers } from '../api/mutes';

export const MUTED_USERS_QUERY_KEY = ['users', 'muted'] as const;

export function useMutedUsers(enabled = true) {
  return useQuery({
    queryKey: MUTED_USERS_QUERY_KEY,
    queryFn: () => getMutedUsers(),
    enabled,
  });
}

export function useMuteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => muteUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MUTED_USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
    },
  });
}

export function useUnmuteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => unmuteUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MUTED_USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
    },
  });
}
