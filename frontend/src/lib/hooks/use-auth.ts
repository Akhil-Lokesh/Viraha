'use client';

import { useAuthStore } from '../stores/auth-store';

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
