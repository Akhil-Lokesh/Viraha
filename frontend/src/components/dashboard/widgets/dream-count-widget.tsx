'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { Star } from 'lucide-react';
import { AnimatedCounter } from '../animated-counter';
import { useWantToGo } from '@/lib/hooks/use-want-to-go';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#F59E0B';

export function DreamCountWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const c = getWidgetColorStyles(color ?? DEFAULT_COLOR, theme.palette.mode);
  const isWide = size.cols >= 2;

  const { data: items } = useWantToGo();
  const dreaming = (items ?? []).filter((i) => i.status === 'dreaming').length;
  const planned = (items ?? []).filter((i) => i.status === 'planned').length;
  const total = dreaming + planned;

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
        <Star style={{ width: isWide ? 22 : 18, height: isWide ? 22 : 18, color: c.accent }} />
      </Box>
      <Box sx={{ textAlign: isWide ? 'left' : 'center' }}>
        <AnimatedCounter
          value={total}
          sx={{ fontSize: isWide ? '3rem' : '2.5rem', fontWeight: 'bold', color: c.accent, lineHeight: 1 }}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
          {total === 1 ? 'Dream' : 'Dreams'}
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
