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
      {/* Warning stamp */}
      <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: 1,
          border: '1.5px solid var(--mui-palette-error-main)',
          bgcolor: 'background.paper',
          transform: 'rotate(-3deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle style={{ width: 44, height: 44, color: 'var(--mui-palette-error-main)' }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography
          sx={{
            fontFamily: 'var(--font-brand)',
            fontWeight: 600,
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--viraha-gold, #D4A843)',
          }}
        >
          Turbulence · Unexpected error
        </Typography>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-accent)', fontWeight: 400 }}>
          Something went wrong
        </Typography>
        <Typography sx={{ color: 'text.secondary', maxWidth: 448 }}>
          An unexpected error occurred. Don&rsquo;t worry, your memories are safe.
        </Typography>
      </Box>
      <Button
        variant="contained"
        disableElevation
        onClick={reset}
        size="large"
        sx={{
          bgcolor: 'var(--viraha-gold, #D4A843)',
          color: '#221C18',
          borderRadius: 1,
          fontWeight: 600,
          '&:hover': {
            bgcolor: 'warning.dark',
            boxShadow: '2px 2px 0 var(--viraha-hairline, rgba(34,28,24,0.15))',
          },
        }}
      >
        Try Again
      </Button>
    </Box>
  );
}
