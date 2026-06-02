'use client';

import { useEffect } from 'react';
import { fetchCsrfToken } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getMe } from '@/lib/api/auth';

export function CsrfInitializer() {
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  // Refresh the full session once at app level. The persisted store only holds a
  // non-PII subset of the user, so a store-hydrated user is partial (missing
  // emailVerified, bio, home*). Re-fetch /me when there is no user or only a
  // partial one so consumers (e.g. Settings) see complete data.
  useEffect(() => {
    const { user, setUser } = useAuthStore.getState();
    if (user && 'emailVerified' in user) return;

    getMe()
      .then(setUser)
      .catch(() => {
        // Not authenticated or token expired — leave the store untouched.
      });
  }, []);

  return null;
}
