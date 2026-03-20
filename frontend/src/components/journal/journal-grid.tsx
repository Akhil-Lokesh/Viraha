'use client';

import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import type { Journal } from '@/lib/types';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { JournalCard } from './journal-card';
import { EmptyState } from '@/components/shared/empty-state';

export function JournalGrid({ journals }: { journals: Journal[] }) {
  if (journals.length === 0) {
    return (
      <EmptyState
        icon="compass"
        title="No journals yet"
        description="Create a journal to document your travel stories with entries, photos, and moods."
        actionLabel="Create your first journal"
        actionHref="/create/journal"
      />
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {journals.map((journal) => (
          <motion.div key={journal.id} variants={staggerItem}>
            <JournalCard journal={journal} />
          </motion.div>
        ))}
      </Box>
    </motion.div>
  );
}
