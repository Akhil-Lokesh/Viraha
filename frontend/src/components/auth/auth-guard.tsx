'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydrated } from '@/lib/stores/auth-store';
import { getMe } from '@/lib/api/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const hydrated = useAuthHydrated();
  const router = useRouter();
  // Becomes true once this page load has had a session (persisted or probed).
  const sessionKnown = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      sessionKnown.current = true;
      return;
    }
    if (sessionKnown.current) {
      // Signed out or the session expired mid-visit.
      router.replace('/sign-in');
      return;
    }
    // Nothing persisted in this browser, but the httpOnly session cookie may
    // still be valid (storage was cleared, or the session began elsewhere).
    // Ask the server once before sending the visitor to sign in.
    sessionKnown.current = true;
    getMe()
      .then(setUser)
      .catch(() => router.replace('/sign-in'));
  }, [hydrated, user, setUser, router]);

  // Show nothing (matching bg) while the store hydrates, the session is checked, or we redirect.
  if (!hydrated || !user) {
    return <div style={{ position: 'fixed', inset: 0, background: 'var(--cin-bg)' }} />;
  }

  return <>{children}</>;
}
