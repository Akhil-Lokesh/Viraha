'use client';

import { Plane, Home } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { useTravelStore } from '@/lib/stores/travel-store';
import type { SxProps, Theme } from '@mui/material';

interface TravelModeIndicatorProps {
  variant?: 'full' | 'compact';
  sx?: SxProps<Theme>;
}

export function TravelModeIndicator({ variant = 'full', sx }: TravelModeIndicatorProps) {
  const mode = useTravelStore((s) => s.mode);
  const isTraveling = mode === 'traveling';

  if (variant === 'compact') {
    return (
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', ...sx as object }}>
        {isTraveling ? (
          <Plane style={{ height: 16, width: 16, color: '#3b82f6' }} />
        ) : (
          <Home style={{ height: 16, width: 16, color: 'var(--mui-palette-text-secondary)' }} />
        )}
        {isTraveling && (
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              height: 8,
              width: 8,
              borderRadius: '50%',
              bgcolor: '#3b82f6',
              outline: '2px solid',
              outlineColor: 'background.default',
            }}
          />
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        borderRadius: 2,
        px: 1.5,
        py: 1,
        fontSize: '0.875rem',
        ...(isTraveling
          ? {
              bgcolor: 'rgba(59,130,246,0.1)',
              color: (theme: Theme) =>
                theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb',
            }
          : {
              bgcolor: 'action.hover',
              color: 'text.secondary',
            }),
        ...sx as object,
      }}
    >
      {isTraveling ? <Plane style={{ height: 16, width: 16 }} /> : <Home style={{ height: 16, width: 16 }} />}
      <Typography component="span" sx={{ fontWeight: 500, fontSize: 'inherit', color: 'inherit' }}>
        {isTraveling ? 'Traveling' : 'Local'}
      </Typography>
    </Box>
  );
}
