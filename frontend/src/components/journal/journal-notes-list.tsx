'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';
import type { Journal } from '@/lib/types';
import { JournalCard } from './journal-card';

const GOLD = 'var(--viraha-gold, #D4A843)';

interface JournalNotesListProps {
  journals: Journal[];
}

/** Empty shelf — a leaning outline of journal spines with a stamp. */
function EmptyJournalShelf() {
  return (
    <Box
      component={motion.div}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: 10 }}
    >
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 0.75, height: 88, mb: 4 }}>
        {[{ h: 80, r: 0 }, { h: 88, r: 0 }, { h: 72, r: 7 }].map(({ h, r }, i) => (
          <Box
            key={i}
            sx={(theme) => ({
              width: 22,
              height: h,
              transform: `rotate(${r}deg)`,
              transformOrigin: 'bottom left',
              border: '1.5px dashed',
              borderColor:
                theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.35)' : 'rgba(34,28,24,0.35)',
              borderRadius: '2px 4px 4px 2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            {i === 1 && <BookOpen style={{ width: 13, height: 13, color: GOLD }} />}
          </Box>
        ))}
        <Box
          sx={{
            position: 'absolute',
            top: -16,
            right: -34,
            transform: 'rotate(8deg)',
            border: `1.5px solid ${GOLD}`,
            color: GOLD,
            borderRadius: '4px',
            px: 0.75,
            py: 0.25,
            fontFamily: 'var(--font-brand)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Unwritten
        </Box>
      </Box>
      <Typography
        sx={(theme) => ({
          fontFamily: 'var(--font-accent)',
          fontSize: '1.5rem',
          color:
            theme.palette.mode === 'dark'
              ? 'var(--viraha-ink-dark, #F2EAD9)'
              : 'var(--viraha-ink, #221C18)',
          mb: 1,
        })}
      >
        No journals on the shelf yet
      </Typography>
      <Typography sx={{ color: 'text.secondary', maxWidth: 384 }}>
        Start a journal and it will live here as a cloth-bound book.
      </Typography>
    </Box>
  );
}

export function JournalNotesList({ journals }: JournalNotesListProps) {
  if (journals.length === 0) {
    return <EmptyJournalShelf />;
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
