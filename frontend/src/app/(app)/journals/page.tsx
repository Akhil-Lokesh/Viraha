'use client';

import { useState, useMemo } from 'react';
import { Box, Typography, InputBase } from '@mui/material';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { motion } from 'framer-motion';
import { Plus, Search, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useJournals } from '@/lib/hooks/use-journals';
import { JournalNotesList } from '@/components/journal/journal-notes-list';
import { fadeInUp, fadeIn } from '@/lib/animations';

export default function JournalsPage() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useJournals();

  const [search, setSearch] = useState('');

  const journals = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.items) ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((j) => j.title.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header section */}
      <Box
        component={motion.div}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        sx={{
          pt: { xs: 2, md: 4 },
          mb: 4,
        }}
      >
        {/* Title row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 0 },
            mb: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Journals
            </Typography>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.85rem', md: '0.95rem' },
                mt: 1,
                maxWidth: 380,
                lineHeight: 1.5,
              }}
            >
              An archive of letters to your future self. Quiet reflections on
              places visited and moments felt.
            </Typography>
          </Box>

          {/* Search + New button */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: { xs: '100%', md: 'auto' },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.25,
                borderRadius: '12px',
                bgcolor: 'action.hover',
                border: 1,
                borderColor: 'divider',
                flex: { xs: 1, md: 'unset' },
                width: { md: 240 },
              }}
            >
              <Search
                style={{
                  width: 16,
                  height: 16,
                  color: 'var(--mui-palette-text-secondary)',
                }}
              />
              <InputBase
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries..."
                fullWidth
                sx={{ fontSize: '0.85rem' }}
              />
            </Box>

            <Button
              variant="contained"
              disableElevation
              component={Link}
              href="/create/journal"
              sx={{
                borderRadius: '12px',
                flexShrink: 0,
                bgcolor: 'secondary.main',
                color: 'white',
                px: 2.5,
                py: 1.25,
                fontSize: '0.85rem',
                fontWeight: 600,
                '&:hover': { bgcolor: 'secondary.dark' },
              }}
            >
              <Plus style={{ width: 16, height: 16, marginRight: 6 }} />
              New Journal
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              animation="pulse"
              sx={{
                borderRadius: '16px',
                height: { xs: 260, md: 320 },
              }}
            />
          ))}
        </Box>
      ) : (
        <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible">
          <JournalNotesList journals={journals} />

          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="outlined"
                disableElevation
                size="large"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                sx={{ borderRadius: '9999px', px: 4 }}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* FAB — Write new memory */}
      <Link href="/create/journal" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 32 },
            right: { xs: 16, md: 32 },
            bgcolor: 'secondary.main',
            color: 'white',
            borderRadius: '16px',
            boxShadow: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2.5,
            py: 1.5,
            '&:hover': { bgcolor: 'secondary.dark' },
            transition: 'background-color 0.2s',
            zIndex: 50,
          }}
        >
          <Pencil style={{ width: 18, height: 18 }} />
          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 600,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Write new memory
          </Typography>
        </Box>
      </Link>
    </Box>
  );
}
