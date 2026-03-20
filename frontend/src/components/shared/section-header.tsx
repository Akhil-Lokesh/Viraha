'use client';

import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  sx?: SxProps<Theme>;
}

export function SectionHeader({
  title,
  subtitle,
  align = 'center',
  sx: sxProp,
}: SectionHeaderProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      style={{ textAlign: align }}
    >
      <Typography
        variant="h2"
        sx={{
          fontSize: { xs: '1.875rem', md: '2.25rem' },
          fontWeight: 700,
          letterSpacing: '-0.025em',
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            mt: 1.5,
            fontSize: '1.125rem',
            color: 'text.secondary',
            maxWidth: 672,
            mx: align === 'center' ? 'auto' : undefined,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </motion.div>
  );
}
