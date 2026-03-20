'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { Lock, Gift } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTimeCapsules } from '@/lib/hooks/use-time-capsules';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#6366F1';

export function NextCapsuleWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const c = getWidgetColorStyles(color ?? DEFAULT_COLOR, theme.palette.mode);
  const isWide = size.cols >= 2;

  const { data: capsules } = useTimeCapsules(true);
  const sealed = (capsules ?? []).filter((cap) => !cap.isOpened);
  const openable = (capsules ?? []).filter((cap) => cap.isOpenable);
  const next = sealed.sort((a, b) => new Date(a.openAt).getTime() - new Date(b.openAt).getTime())[0];

  // Has an openable capsule — celebration state
  if (openable.length > 0) {
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
            bgcolor: 'rgba(16,185,129,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          <Gift style={{ width: isWide ? 22 : 18, height: isWide ? 22 : 18, color: '#10B981' }} />
        </Box>
        <Box sx={{ textAlign: isWide ? 'left' : 'center' }}>
          <Typography sx={{ fontSize: isWide ? '1.1rem' : '0.9rem', fontWeight: 800, color: '#10B981', lineHeight: 1.2 }}>
            Ready!
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25, fontSize: '0.75rem' }}>
            {openable.length} {openable.length === 1 ? 'capsule' : 'capsules'} to open
          </Typography>
        </Box>
      </Box>
    );
  }

  // Sealed capsule with countdown
  if (next) {
    const opensIn = formatDistanceToNow(new Date(next.openAt));
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
          <Lock style={{ width: isWide ? 22 : 18, height: isWide ? 22 : 18, color: c.accent }} />
        </Box>
        <Box sx={{ textAlign: isWide ? 'left' : 'center' }}>
          <Typography sx={{ fontSize: isWide ? '0.85rem' : '0.75rem', fontWeight: 700, color: c.accent, lineHeight: 1.2 }}>
            {opensIn}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25, fontSize: '0.7rem' }}>
            until next capsule
          </Typography>
        </Box>
      </Box>
    );
  }

  // No capsules
  return (
    <Box
      sx={{
        bgcolor: c.bgTint,
        borderRadius: '16px',
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
      }}
    >
      <Lock style={{ width: 20, height: 20, color: c.accent, opacity: 0.5 }} />
      <Typography sx={{ fontSize: '10px', color: 'text.disabled', textAlign: 'center' }}>
        No capsules
      </Typography>
    </Box>
  );
}
