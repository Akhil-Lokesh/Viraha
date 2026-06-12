'use client';

import { Box, type SxProps, type Theme } from '@mui/material';
import { CIN, glowRing } from '@/lib/design/cinema-tokens';

interface CinemaCardProps {
  children: React.ReactNode;
  /** Accent glow + lift on hover (default on — keep for interactive cards only). */
  hover?: boolean;
  sx?: SxProps<Theme>;
}

/** Dark surface card: hairline border, accent-glow hover, no soft shadows. */
export function CinemaCard({ children, hover = true, sx }: CinemaCardProps) {
  return (
    <Box
      sx={{
        bgcolor: 'var(--cin-surface, #141419)',
        border: `1px solid ${CIN.hairline}`,
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'box-shadow .2s ease, transform .2s ease',
        ...(hover && {
          '&:hover': { boxShadow: glowRing(1), transform: 'translateY(-2px)' },
        }),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
