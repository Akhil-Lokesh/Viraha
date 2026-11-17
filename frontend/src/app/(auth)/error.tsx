'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { GlowButton } from '@/components/cinema';
import { displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: 'var(--cin-bg)',
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
        <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>
          Unexpected error
        </Typography>
        <Typography variant="h5" sx={{ ...displaySx, mb: 2 }}>
          Something went wrong
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted)', mb: 3 }}>
          We encountered an error. Please try again.
        </Typography>
        <GlowButton onClick={reset}>Try again</GlowButton>
      </Box>
    </Box>
  );
}
