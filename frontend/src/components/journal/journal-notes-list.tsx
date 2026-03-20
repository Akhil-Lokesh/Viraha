'use client';

import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import type { Journal } from '@/lib/types';
import { JournalCard } from './journal-card';

interface JournalNotesListProps {
  journals: Journal[];
}

export function JournalNotesList({ journals }: JournalNotesListProps) {
  if (journals.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Box sx={{ color: 'text.secondary', fontSize: '1rem' }}>
          No journals yet
        </Box>
      </Box>
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
        <Box
          key={journal.id}
          component={motion.div}
          variants={staggerItem}
        >
          <JournalCard journal={journal} />
        </Box>
      ))}
    </Box>
  );
}
