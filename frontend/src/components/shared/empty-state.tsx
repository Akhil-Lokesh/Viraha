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
        sx={(theme) => ({
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : '#fff2e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        })}
      >
        <Icon style={{ width: 40, height: 40, color: 'var(--mui-palette-text-secondary)' }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'text.secondary', maxWidth: 384, mb: 3 }}>
        {description}
      </Typography>
      {actionLabel && actionHref && (
        <Button variant="contained" disableElevation component={Link} href={actionHref}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
