'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, revokeSession, revokeOtherSessions } from '../api/sessions';

export const SESSIONS_QUERY_KEY = ['auth', 'sessions'] as const;

export function useSessions(enabled = true) {
  return useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => getSessions(),
    enabled,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => revokeOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });
}
