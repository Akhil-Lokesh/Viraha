'use client';

import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import * as Sentry from '@sentry/nextjs';
import Button from '@mui/material/Button';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 3,
      }}
    >
      <Box
        sx={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: 'error.light',
          opacity: 0.1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle style={{ width: 48, height: 48, color: 'var(--mui-palette-error-main)' }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Something went wrong</Typography>
        <Typography sx={{ color: 'text.secondary', maxWidth: 448 }}>
          {error.message || 'An unexpected error occurred. Don\u2019t worry, your memories are safe.'}
        </Typography>
      </Box>
      <Button variant="contained" disableElevation onClick={reset} size="large">
        Try Again
      </Button>
    </Box>
  );
}
