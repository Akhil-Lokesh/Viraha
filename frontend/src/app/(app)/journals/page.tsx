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

const GOLD = 'var(--viraha-gold, #D4A843)';

const eyebrowSx = {
  fontFamily: 'var(--font-brand)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: GOLD,
} as const;

/** Skeleton shaped like a book cover: spine band + cover block. */
function BookSkeleton() {
  return (
    <Box sx={{ position: 'relative' }}>
      <Skeleton
        variant="rounded"
        animation="pulse"
        sx={{ borderRadius: '3px 10px 10px 3px', height: { xs: 260, md: 320 }, width: '100%' }}
      />
      <Box
        sx={(theme) => ({
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 14,
          bgcolor:
            theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.08)' : 'rgba(34,28,24,0.08)',
          borderRadius: '3px 0 0 3px',
        })}
      />
    </Box>
  );
}

export default function JournalsPage() {
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
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
          mb: 5,
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
            <Typography sx={{ ...eyebrowSx, mb: 0.75 }}>The Shelf — Field Journals</Typography>
            <Typography
              component="h1"
              sx={(theme) => ({
                fontSize: { xs: '2.25rem', md: '3rem' },
                fontFamily: 'var(--font-accent)',
                lineHeight: 1.05,
                color:
                  theme.palette.mode === 'dark'
                    ? 'var(--viraha-ink-dark, #F2EAD9)'
                    : 'var(--viraha-ink, #221C18)',
              })}
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
            {/* Field-notes search */}
            <Box
              sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.25,
                borderRadius: '4px',
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(242,234,217,0.04)'
                    : 'rgba(34,28,24,0.02)',
                border: '1px solid',
                borderColor:
                  theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.2)' : 'rgba(34,28,24,0.25)',
                borderBottomStyle: 'dashed',
                borderBottomColor: GOLD,
                flex: { xs: 1, md: 'unset' },
                width: { md: 240 },
                '&:focus-within': { borderColor: GOLD },
              })}
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
              variant="outlined"
              disableElevation
              component={Link}
              href="/create/journal"
              sx={{
                borderRadius: '4px',
                flexShrink: 0,
                borderColor: GOLD,
                color: 'text.primary',
                px: 2.5,
                py: 1.25,
                fontSize: '0.85rem',
                fontWeight: 600,
                '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
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
            <BookSkeleton key={i} />
          ))}
        </Box>
      ) : isError ? (
        <Box
          component={motion.div}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          sx={(theme) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            textAlign: 'center',
            gap: 1.5,
            mx: 'auto',
            maxWidth: 480,
            border: '1px dashed',
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.25)' : 'rgba(34,28,24,0.25)',
            borderRadius: '6px',
          })}
        >
          <Typography sx={{ fontFamily: 'var(--font-accent)', fontSize: '1.4rem' }}>
            Couldn&apos;t load your journals
          </Typography>
          <Typography sx={{ color: 'text.secondary', maxWidth: 384 }}>
            Something went wrong while loading your journals. Please try again.
          </Typography>
          <Button
            variant="outlined"
            disableElevation
            onClick={() => refetch()}
            sx={{
              borderRadius: '4px',
              px: 4,
              mt: 1,
              borderColor: GOLD,
              color: 'text.primary',
              fontWeight: 600,
              '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
            }}
          >
            Try Again
          </Button>
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
                sx={{
                  borderRadius: '4px',
                  px: 4,
                  borderColor: GOLD,
                  color: 'text.primary',
                  fontWeight: 600,
                  '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
                }}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* FAB — Write new memory (small purple interactive accent, per brief) */}
      <Link href="/create/journal" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 32 },
            right: { xs: 16, md: 32 },
            bgcolor: 'secondary.main',
            color: 'white',
            borderRadius: '4px',
            boxShadow: '3px 3px 0 rgba(34,28,24,0.25)',
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
