'use client';

import { useEffect } from 'react';
import { isAxiosError } from 'axios';
import { fetchCsrfToken } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getMe } from '@/lib/api/auth';

export function CsrfInitializer() {
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  // Reconcile client auth state with the server exactly once on load.
  //
  // The persisted store only holds a non-PII subset of the user, so a
  // store-hydrated user is partial (missing emailVerified, bio, home*). We
  // probe /me ONLY when a persisted user exists, to (a) complete that partial
  // record and (b) confirm the session is still valid. A logged-out visitor
  // must NOT probe /me — doing so would 401 and bounce them off the public
  // landing page (the "home or sign-in, idk why" bug).
  useEffect(() => {
    const { user, setUser, logout } = useAuthStore.getState();
    if (!user) return;
    if ('emailVerified' in user) return;

    getMe()
      .then(setUser)
      .catch((err: unknown) => {
        // Genuine auth failure (session + refresh token both expired): clear the
        // stale persisted user so routing is deterministic on the next render —
        // the guard sends protected routes to /sign-in, root shows the landing.
        // A transient network error (backend down) must NOT log the user out.
        if (isAxiosError(err) && err.response?.status === 401) {
          logout();
        }
      });
  }, []);

  return null;
}
