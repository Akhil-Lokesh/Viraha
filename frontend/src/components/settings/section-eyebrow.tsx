'use client';

import { Box } from '@mui/material';

interface SectionEyebrowProps {
  children: React.ReactNode;
  /** Renders the eyebrow in the gold accent instead of muted ink. */
  gold?: boolean;
  id?: string;
}

/**
 * Posterama micro-label used above each settings section, per the
 * Keepsake design brief (uppercase, letter-spaced, 11px).
 */
export function SectionEyebrow({ children, gold = false, id }: SectionEyebrowProps) {
  return (
    <Box
      component="p"
      id={id}
      sx={{
        m: 0,
        mb: 1,
        fontFamily: 'var(--font-brand, Posterama, sans-serif)',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: gold ? 'var(--viraha-gold, #D4A843)' : 'text.secondary',
        opacity: gold ? 1 : 0.85,
      }}
    >
      {children}
    </Box>
  );
}
