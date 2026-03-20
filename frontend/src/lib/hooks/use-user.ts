'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserByUsername, searchUsers } from '../api/users';

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
