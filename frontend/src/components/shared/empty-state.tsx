'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { MapPin, Camera, Compass } from 'lucide-react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { GlowButton } from '@/components/cinema/glow-button';
import { SectionLabel } from '@/components/cinema/section-label';

interface EmptyStateProps {
  icon?: 'map' | 'camera' | 'compass';
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

const icons = {
  map: MapPin,
  camera: Camera,
  compass: Compass,
};

const eyebrows = {
  map: 'No pins on the map',
  camera: 'Nothing here yet',
  compass: 'Uncharted territory',
};

/** Dark-cinematic empty state: glowing icon halo, clear accent CTA. */
export function EmptyState({
  icon = 'compass',
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingBottom: 80,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 88,
          height: 88,
          mb: 3,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--cin-accent, #8B7CFF)',
          bgcolor: 'var(--cin-surface, #141419)',
          border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
          boxShadow: '0 0 60px var(--cin-accent-glow, rgba(139,124,255,0.35))',
        }}
      >
        <Icon style={{ width: 36, height: 36, color: 'inherit' }} />
      </Box>

      <SectionLabel>{eyebrows[icon]}</SectionLabel>

      <Typography
        sx={{
          fontFamily: 'Posterama, var(--font-body)',
          fontWeight: 700,
          fontSize: 22,
          color: 'var(--cin-text, #F4F4F6)',
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{ color: 'var(--cin-text-muted, #9A9AA6)', maxWidth: 420, mb: 3 }}
      >
        {description}
      </Typography>
      {actionLabel && actionHref && (
        <GlowButton component={Link} href={actionHref}>
          {actionLabel}
        </GlowButton>
      )}
    </motion.div>
  );
}
