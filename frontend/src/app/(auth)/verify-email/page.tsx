'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, MailWarning } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { verifyEmail } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import { displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import { authStagger, authItem, authLinkSx, statusChipSx } from '../auth-styles';

type VerifyState = 'loading' | 'success' | 'error' | 'missing';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'missing');
  const [errorMessage, setErrorMessage] = useState('');
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await verifyEmail(token);
        if (cancelled) return;
        updateUser({ emailVerified: true });
        setState('success');
      } catch (err: unknown) {
        if (cancelled) return;
        const errData = (err as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
        const message = typeof errData === 'string' ? errData : errData?.message || 'This verification link is invalid or has expired.';
        setErrorMessage(message);
        setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, updateUser]);

  if (state === 'loading') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <CircularProgress size={24} sx={{ color: 'var(--cin-accent)' }} />
      </Box>
    );
  }

  if (state === 'missing') {
    return (
      <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography sx={eyebrowSx}>Verify email</Typography>
        <Typography variant="h5" sx={{ ...displaySx, fontSize: '1.875rem' }}>
          Missing verification token
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted)' }}>
          Open the verification link from your email to confirm your address.
        </Typography>
        <Link href="/sign-in" style={{ textDecoration: 'none' }}>
          <Typography sx={authLinkSx}>Back to sign in</Typography>
        </Link>
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      variants={authStagger}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'center' }}
    >
      <Box
        component={motion.div}
        variants={authItem}
        sx={{
          ...statusChipSx,
          alignSelf: 'center',
          color: state === 'success' ? 'var(--cin-accent)' : 'var(--cin-danger)',
        }}
      >
        {state === 'success' ? (
          <CheckCircle style={{ width: 24, height: 24, color: 'inherit' }} />
        ) : (
          <MailWarning style={{ width: 24, height: 24, color: 'inherit' }} />
        )}
      </Box>
      <Box component={motion.div} variants={authItem}>
        <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>Verify email</Typography>
        <Typography variant="h5" sx={{ ...displaySx, fontSize: '1.875rem' }}>
          {state === 'success' ? 'Email verified' : 'Verification failed'}
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted)', mt: 1, maxWidth: 360, mx: 'auto' }}>
          {state === 'success'
            ? 'Your email is now verified. You can close this tab or continue using Viraha.'
            : errorMessage}
        </Typography>
      </Box>
      <Box component={motion.div} variants={authItem}>
        <Link href={state === 'success' ? '/feed' : '/sign-in'} style={{ textDecoration: 'none' }}>
          <Typography sx={authLinkSx}>
            {state === 'success' ? 'Go to your feed' : 'Back to sign in'}
          </Typography>
        </Link>
      </Box>
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <CircularProgress size={24} sx={{ color: 'var(--cin-accent)' }} />
        </Box>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
