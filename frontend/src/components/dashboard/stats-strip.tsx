'use client';

import { useEffect, useState } from 'react';
import { Box, Skeleton } from '@mui/material';
import { motion, animate } from 'framer-motion';
import { useAtlas } from '@/lib/hooks/use-atlas';
import { StatPill } from '@/components/cinema';
import { staggerItem } from '@/lib/animations';

/**
 * Count up from 0 on mount (~0.8s). Skips straight to the final value when
 * the user prefers reduced motion.
 */
function useCountUp(target: number): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target);
      return;
    }
    const controls = animate(0, target, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [target]);

  return display;
}

interface CountUpPillProps {
  value: number;
  label: string;
  isError: boolean;
}

function CountUpPill({ value, label, isError }: CountUpPillProps) {
  const counted = useCountUp(value);
  return <StatPill value={isError ? '—' : counted} label={label} />;
}

/**
 * Atlas stats strip: countries / cities / memories as StatPills with a
 * count-up reveal. Consolidates the stat-card widgets (same useAtlas source).
 */
export function StatsStrip() {
  const { data: atlas, isLoading, isError } = useAtlas();

  if (isLoading) {
    return (
      <motion.div variants={staggerItem}>
        <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, flexWrap: 'wrap' }}>
          {['countries', 'cities', 'memories'].map((key) => (
            <Skeleton
              key={key}
              variant="rectangular"
              animation="pulse"
              sx={{ width: 110, height: 66, borderRadius: '12px', bgcolor: 'var(--cin-surface-2, #1C1C24)' }}
            />
          ))}
        </Box>
      </motion.div>
    );
  }

  const stats = [
    { label: 'Countries', value: atlas?.stats.totalCountries ?? 0 },
    { label: 'Cities', value: atlas?.stats.totalCities ?? 0 },
    { label: 'Memories', value: atlas?.stats.totalPosts ?? 0 },
  ];

  return (
    <motion.div variants={staggerItem}>
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2 }, flexWrap: 'wrap', alignItems: 'stretch' }}>
        {stats.map((stat) => (
          <CountUpPill key={stat.label} value={stat.value} label={stat.label} isError={isError} />
        ))}
      </Box>
    </motion.div>
  );
}
