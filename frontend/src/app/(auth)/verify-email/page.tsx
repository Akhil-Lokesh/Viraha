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

type VerifyState = 'loading' | 'success' | 'error' | 'missing';

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

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
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (state === 'missing') {
    return (
      <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
          Missing verification token
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Open the verification link from your email to confirm your address.
        </Typography>
        <Link href="/sign-in" style={{ textDecoration: 'none' }}>
          <Typography sx={{ fontSize: '0.875rem', color: 'primary.main', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
            Back to sign in
          </Typography>
        </Link>
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'center' }}
    >
      <Box
        component={motion.div}
        variants={staggerItem}
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: state === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
        }}
      >
        {state === 'success' ? (
          <CheckCircle style={{ width: 24, height: 24, color: '#059669' }} />
        ) : (
          <MailWarning style={{ width: 24, height: 24, color: '#dc2626' }} />
        )}
      </Box>
      <Box component={motion.div} variants={staggerItem}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
          {state === 'success' ? 'Email verified' : 'Verification failed'}
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1, maxWidth: 360, mx: 'auto' }}>
          {state === 'success'
            ? 'Your email is now verified. You can close this tab or continue using Viraha.'
            : errorMessage}
        </Typography>
      </Box>
      <Box component={motion.div} variants={staggerItem}>
        <Link href={state === 'success' ? '/feed' : '/sign-in'} style={{ textDecoration: 'none' }}>
          <Typography sx={{ fontSize: '0.875rem', color: 'primary.main', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
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
          <CircularProgress size={24} />
        </Box>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
