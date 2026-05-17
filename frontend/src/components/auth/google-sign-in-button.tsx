'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { toast } from 'sonner';
import { googleSignIn } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')));
      // If the existing script already loaded, the window.google check above would have caught it.
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(s);
  });
}

export function GoogleSignInButton({ label = 'Continue with Google' }: { label?: string }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || initialized.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response.credential) return;
            setLoading(true);
            try {
              const { user } = await googleSignIn(response.credential);
              setUser(user);
              toast.success(`Welcome${user.displayName ? `, ${user.displayName}` : ''}!`);
              router.push('/home');
            } catch (err: unknown) {
              const errData = (err as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
              const message = typeof errData === 'string' ? errData : errData?.message || 'Google sign-in failed.';
              toast.error(message);
            } finally {
              setLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        initialized.current = true;
      })
      .catch(() => {
        // Script load failure is silent — feature degrades to email/password
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, router, setUser]);

  if (!clientId) return null;

  function handleClick() {
    if (!initialized.current || !window.google?.accounts?.id) {
      toast.error('Google sign-in is still loading. Try again in a moment.');
      return;
    }
    window.google.accounts.id.prompt();
  }

  return (
    <Button
      type="button"
      variant="outlined"
      disableElevation
      onClick={handleClick}
      disabled={loading}
      sx={{
        width: '100%',
        height: 48,
        borderRadius: 3,
        gap: 1.5,
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      <Box component="svg" sx={{ height: 20, width: 20 }} viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </Box>
      {loading ? 'Signing in…' : label}
    </Button>
  );
}
