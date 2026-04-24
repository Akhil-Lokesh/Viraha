'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydrated } from '@/lib/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/sign-in');
    }
  }, [hydrated, user, router]);

  // Show nothing (matching bg) while store hydrates or redirecting
  if (!hydrated || !user) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--mui-palette-background-default, #141218)',
        }}
      />
    );
  }

  return <>{children}</>;
}
