'use client';

import { Typography } from '@mui/material';
import { eyebrowSx } from '@/lib/design/cinema-tokens';

/** Muted uppercase section eyebrow. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography component="h2" sx={{ ...eyebrowSx, mb: 1.5 }}>
      {children}
    </Typography>
  );
}
