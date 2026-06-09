'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { MapPin, Camera, Compass } from 'lucide-react';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';

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
  camera: 'Nothing in the album',
  compass: 'Nothing stamped yet',
};

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
      {/* Motif illustration: passport-stamp cluster on a dashed flight path */}
      <Box sx={{ position: 'relative', width: 168, height: 112, mb: 4 }}>
        {/* Flight-path connector behind the stamps */}
        <Box
          component="svg"
          viewBox="0 0 168 112"
          aria-hidden
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <path
            d="M 6 92 C 48 96, 70 40, 104 38 S 152 22, 164 10"
            fill="none"
            stroke="var(--viraha-gold, #D4A843)"
            strokeWidth="1.25"
            strokeDasharray="6 8"
          />
          <circle cx="164" cy="10" r="3" fill="var(--viraha-gold, #D4A843)" />
        </Box>
        {/* Main stamp with the motif icon */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            ml: '-36px',
            width: 72,
            height: 72,
            borderRadius: 1,
            border: '1.5px solid var(--viraha-gold, #D4A843)',
            bgcolor: 'var(--viraha-paper-raised, #FFFDF7)',
            transform: 'rotate(-3deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--viraha-gold, #D4A843)',
          }}
        >
          <Icon style={{ width: 32, height: 32, color: 'inherit' }} />
        </Box>
        {/* Small companion stamp, slightly overlapping */}
        <Box
          sx={{
            position: 'absolute',
            top: 56,
            right: 14,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1.5px dashed var(--viraha-hairline, rgba(34,28,24,0.15))',
            transform: 'rotate(6deg)',
          }}
        />
      </Box>

      {/* Posterama eyebrow */}
      <Typography
        sx={{
          fontFamily: 'var(--font-brand)',
          fontWeight: 600,
          fontSize: '0.65rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--viraha-gold, #D4A843)',
          mb: 1,
        }}
      >
        {eyebrows[icon]}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          fontFamily: 'var(--font-accent)',
          fontWeight: 400,
          fontSize: '1.5rem',
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', maxWidth: 384, mb: 3 }}>
        {description}
      </Typography>
      {actionLabel && actionHref && (
        <Button
          variant="contained"
          disableElevation
          component={Link}
          href={actionHref}
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
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
