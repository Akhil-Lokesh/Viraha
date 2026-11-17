'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth-store';
import { logoutApi } from '../api/auth';

// The session /me fetch is performed once at app level in <CsrfInitializer />.
// This hook only reads from the store via granular selectors to avoid
// re-running the fetch per consumer and to minimise re-renders.
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return {
    user,
    isAuthenticated: !!user,
    logout,
  };
}

/**
 * End the session everywhere it lives: server cookies, the persisted user, and
 * the query cache (so the next person on this browser never sees cached data
 * from the previous account). Lands on sign-in, where the auth guard sends
 * signed-out visitors anyway.
 */
export function useSignOut(): () => Promise<void> {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Clear local state even if the server call fails (offline, already expired).
    }
    logout();
    queryClient.clear();
    router.replace('/sign-in');
  }, [router, queryClient, logout]);
}
