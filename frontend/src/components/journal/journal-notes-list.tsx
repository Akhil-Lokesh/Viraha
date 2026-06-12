'use client';

import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import type { Journal } from '@/lib/types';
import { EmptyState } from '@/components/shared/empty-state';
import { JournalCard } from './journal-card';

interface JournalNotesListProps {
  journals: Journal[];
}

export function JournalNotesList({ journals }: JournalNotesListProps) {
  if (journals.length === 0) {
    return (
      <EmptyState
        icon="compass"
        title="No journals yet"
        description="Start a journal and your reflections from the road will live here."
        actionLabel="Start a journal"
        actionHref="/create/journal"
      />
    );
  }

  return (
    <Box
      component={motion.div}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 2.5,
      }}
    >
      {journals.map((journal) => (
        <Box key={journal.id} component={motion.div} variants={staggerItem}>
          <JournalCard journal={journal} />
        </Box>
      ))}
    </Box>
  );
}
