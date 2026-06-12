'use client';

import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import * as Sentry from '@sentry/nextjs';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { GlowButton } from '@/components/cinema';
import { eyebrowSx, displaySx } from '@/lib/design/cinema-tokens';
import { fadeInUp } from '@/lib/animations';

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
      component={motion.div}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
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
      {/* Danger halo */}
      <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--cin-danger, #FF6B6B)',
          bgcolor: 'var(--cin-surface, #141419)',
          border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
          boxShadow: '0 0 60px rgba(255,107,107,0.25)',
        }}
      >
        <AlertTriangle style={{ width: 36, height: 36, color: 'inherit' }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography sx={eyebrowSx}>Turbulence · Unexpected error</Typography>
        <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: 28, md: 34 } }}>
          Something went wrong
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted, #9A9AA6)', maxWidth: 448 }}>
          An unexpected error occurred. Don&rsquo;t worry, your memories are safe.
        </Typography>
      </Box>
      <GlowButton onClick={reset} size="large">
        Try Again
      </GlowButton>
    </Box>
  );
}
