'use client';

import { Box, Typography } from '@mui/material';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { GlowButton } from '@/components/cinema';
import { eyebrowSx, displaySx } from '@/lib/design/cinema-tokens';
import { fadeInUp } from '@/lib/animations';

export default function NotFound() {
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
      {/* Glowing compass halo */}
      <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--cin-accent, #8B7CFF)',
          bgcolor: 'var(--cin-surface, #141419)',
          border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
          boxShadow: '0 0 60px var(--cin-accent-glow, rgba(139,124,255,0.35))',
        }}
      >
        <Compass style={{ width: 36, height: 36, color: 'inherit' }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography sx={eyebrowSx}>Off the map · 404</Typography>
        <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: 28, md: 34 } }}>
          Lost in transit
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted, #9A9AA6)', maxWidth: 448 }}>
          This page seems to have wandered off the map. Let&apos;s get you back
          on track.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <GlowButton component={Link} href="/home">
          Go Home
        </GlowButton>
        <GlowButton variant="ghost" component={Link} href="/explore">
          Explore
        </GlowButton>
      </Box>
    </Box>
  );
}
