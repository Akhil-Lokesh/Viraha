'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { Flame } from 'lucide-react';
import { AnimatedCounter } from '../animated-counter';
import { usePostsFeed } from '@/lib/hooks/use-posts';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#F97316';

/**
 * Compute how many consecutive months the user has posted.
 */
function computeStreak(posts: Array<{ postedAt: string }>): number {
  if (posts.length === 0) return 0;

  const months = new Set<string>();
  for (const p of posts) {
    const d = new Date(p.postedAt);
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const sorted = [...months].sort().reverse();
  const now = new Date();
  let expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let streak = 0;

  for (const m of sorted) {
    if (m === expected) {
      streak++;
      const [y, mo] = expected.split('-').map(Number);
      const prev = mo === 1 ? new Date(y - 1, 11, 1) : new Date(y, mo - 2, 1);
      expected = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    } else if (m < expected) {
      break;
    }
  }

  return streak;
}

export function StreakWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const c = getWidgetColorStyles(color ?? DEFAULT_COLOR, theme.palette.mode);
  const isWide = size.cols >= 2;

  const { data } = usePostsFeed();
  const posts = data?.pages.flatMap((p) => p.items) ?? [];
  const streak = computeStreak(posts);

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
        <Flame style={{ width: isWide ? 22 : 18, height: isWide ? 22 : 18, color: c.accent }} />
      </Box>
      <Box sx={{ textAlign: isWide ? 'left' : 'center' }}>
        <AnimatedCounter
          value={streak}
          sx={{ fontSize: isWide ? '3rem' : '2.5rem', fontWeight: 'bold', color: c.accent, lineHeight: 1 }}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
          {streak === 1 ? 'Month Streak' : 'Month Streak'}
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
