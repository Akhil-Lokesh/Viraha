'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import LandingPage from './(marketing)/landing-page';
import MarketingLayout from './(marketing)/layout';

/**
 * Root page — routes based on authentication status.
 *
 * Authenticated users  -> redirect to /feed
 * Unauthenticated users -> render the marketing landing page
 *
 * This is the authoritative handler for "/". The (marketing) route group
 * layout and page are composed here for unauthenticated visitors, while
 * other marketing pages (e.g. /about) are served directly by the
 * (marketing) route group.
 */
export default function RootPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && user) {
      router.replace('/home');
    }
  }, [hydrated, user, router]);

  // While zustand hydrates from localStorage, show nothing to avoid flash
  if (!hydrated || user) {
    return null;
  }

  // Unauthenticated users see the full marketing experience
  return (
    <MarketingLayout>
      <LandingPage />
    </MarketingLayout>
  );
}
