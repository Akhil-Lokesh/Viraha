'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { Globe } from 'lucide-react';
import { AnimatedCounter } from '../animated-counter';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#7B68EE';

export function StatsCountriesWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const c = getWidgetColorStyles(color ?? DEFAULT_COLOR, theme.palette.mode);
  const isWide = size.cols >= 2;

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
        <Globe style={{ width: isWide ? 22 : 18, height: isWide ? 22 : 18, color: c.accent }} />
      </Box>
      <Box sx={{ textAlign: isWide ? 'left' : 'center' }}>
        <AnimatedCounter
          value={12}
          sx={{ fontSize: isWide ? '3rem' : '2.5rem', fontWeight: 'bold', color: c.accent, lineHeight: 1 }}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
          Countries
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
