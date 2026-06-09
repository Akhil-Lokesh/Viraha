'use client';

import { Box, Typography, Skeleton, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { useAtlas } from '@/lib/hooks/use-atlas';
import { getJournalTokens, eyebrowSx, displaySerifSx, spreadItem } from './journal-tokens';

interface StampDef {
  label: string;
  value: number;
  rotation: number;
}

/**
 * Slim passport-stamp stats strip: countries / cities / memories.
 * Consolidates the old stat-card widgets (same useAtlas source of truth).
 */
export function StampStrip() {
  const theme = useTheme();
  const t = getJournalTokens(theme.palette.mode === 'dark' ? 'dark' : 'light');
  const { data: atlas, isLoading, isError } = useAtlas();

  if (isLoading) {
    return (
      <motion.div variants={spreadItem}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[-1.5, 1, -0.5].map((rot) => (
            <Skeleton
              key={rot}
              variant="rectangular"
              animation="pulse"
              sx={{ width: 128, height: 72, borderRadius: '4px', transform: `rotate(${rot}deg)`, bgcolor: t.inkHairline }}
            />
          ))}
        </Box>
      </motion.div>
    );
  }

  const stamps: StampDef[] = [
    { label: 'Countries', value: atlas?.stats.totalCountries ?? 0, rotation: -1.5 },
    { label: 'Cities', value: atlas?.stats.totalCities ?? 0, rotation: 1.25 },
    { label: 'Memories', value: atlas?.stats.totalPosts ?? 0, rotation: -0.75 },
  ];

  return (
    <motion.div variants={spreadItem}>
      <Box sx={{ display: 'flex', gap: { xs: 1.5, md: 2.5 }, flexWrap: 'wrap', alignItems: 'center' }}>
        {stamps.map((stamp) => (
          <Box
            key={stamp.label}
            sx={{
              transform: `rotate(${stamp.rotation}deg)`,
              border: '1.5px solid',
              borderColor: t.goldHairline,
              borderRadius: '4px',
              px: { xs: 2, md: 2.5 },
              py: 1,
              minWidth: 104,
              textAlign: 'center',
              bgcolor: 'transparent',
              transition: 'transform 0.2s, border-color 0.2s',
              '&:hover': { transform: 'rotate(0deg)', borderColor: t.gold },
            }}
          >
            <Typography component="p" sx={{ ...displaySerifSx, color: t.ink, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              {isError ? '—' : stamp.value}
            </Typography>
            <Typography component="p" sx={{ ...eyebrowSx, fontSize: '10px', color: t.gold, mt: 0.25 }}>
              {stamp.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </motion.div>
  );
}
