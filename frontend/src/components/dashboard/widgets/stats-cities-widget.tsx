'use client';

import { Box, Typography, useTheme, Skeleton } from '@mui/material';
import { Building2 } from 'lucide-react';
import { AnimatedCounter } from '../animated-counter';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { useAtlas } from '@/lib/hooks/use-atlas';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#2563EB';

export function StatsCitiesWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const c = getWidgetColorStyles(color ?? DEFAULT_COLOR, theme.palette.mode);
  const isWide = size.cols >= 2;

  const { data: atlas, isLoading, isError } = useAtlas();
  // Real source of truth — derive from the user's visited-cities atlas summary.
  const count = atlas?.stats.totalCities ?? 0;

  if (isLoading) {
    return (
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', height: '100%', bgcolor: c.bgTint }}>
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: c.bgTint,
        borderRadius: '16px',
        p: isWide ? 2.5 : 2,
        height: '100%',
        display: 'flex',
        flexDirection: isWide ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isWide ? 2 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: isWide ? 44 : 36,
          height: isWide ? 44 : 36,
          borderRadius: '50%',
          bgcolor: c.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Building2 style={{ width: isWide ? 22 : 18, height: isWide ? 22 : 18, color: c.accent }} />
      </Box>
      <Box sx={{ textAlign: isWide ? 'left' : 'center' }}>
        {isError ? (
          <Typography
            sx={{ fontSize: isWide ? '3rem' : '2.5rem', fontWeight: 'bold', color: 'text.disabled', lineHeight: 1 }}
          >
            &mdash;
          </Typography>
        ) : (
          <AnimatedCounter
            value={count}
            sx={{ fontSize: isWide ? '3rem' : '2.5rem', fontWeight: 'bold', color: c.accent, lineHeight: 1 }}
          />
        )}
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
          {isError ? "Couldn't load" : 'Cities'}
        </Typography>
      </Box>

      {isWide && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: c.accent,
            borderRadius: '0 0 16px 16px',
          }}
        />
      )}
    </Box>
  );
}
