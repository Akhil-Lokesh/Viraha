'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydrated } from '@/lib/stores/auth-store';
import LandingPage from './(marketing)/landing-page';
import MarketingLayout from './(marketing)/layout';

export default function RootPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();

  useEffect(() => {
    if (hydrated && user) {
      router.replace('/home');
    }
  }, [hydrated, user, router]);

  // Same bg as the app while hydrating — prevents any flash
  if (!hydrated) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#141218',
        }}
      />
    );
  }

  // Authenticated users are handled by the useEffect redirect above
  if (user) return null;

  // Unauthenticated users see the marketing landing page
  return (
    <MarketingLayout>
      <LandingPage />
    </MarketingLayout>
  );
}
