'use client';

import { useState, useMemo } from 'react';
import { Box, Typography, InputBase } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Search, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useJournals } from '@/lib/hooks/use-journals';
import { JournalNotesList } from '@/components/journal/journal-notes-list';
import { GlowButton } from '@/components/cinema';
import { CIN, displaySx, eyebrowSx, glowRing } from '@/lib/design/cinema-tokens';
import { fadeInUp, fadeIn } from '@/lib/animations';

/** Skeleton shaped like the journal card: dark surface block with a spine sliver. */
function JournalCardSkeleton() {
  return (
    <Box sx={{ position: 'relative' }}>
      <Skeleton
        variant="rounded"
        animation="pulse"
        sx={{
          borderRadius: '16px',
          height: { xs: 200, md: 232 },
          width: '100%',
          bgcolor: 'var(--cin-surface, #141419)',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '3px',
          bgcolor: 'var(--cin-accent-glow, rgba(139,124,255,0.35))',
          borderRadius: '16px 0 0 16px',
        }}
      />
    </Box>
  );
}

export default function JournalsPage() {
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useJournals();
  const reducedMotion = useReducedMotion();

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
        sx={{ pt: { xs: 2, md: 4 }, mb: 5 }}
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
            <Typography sx={{ ...eyebrowSx, mb: 0.75 }}>Field Journals</Typography>
            <Typography
              component="h1"
              sx={{ ...displaySx, fontSize: { xs: '2.25rem', md: '3rem' } }}
            >
              Journals
            </Typography>
            <Typography
              sx={{
                color: CIN.textMuted,
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
                py: 1,
                borderRadius: '10px',
                bgcolor: 'var(--cin-surface, #141419)',
                border: `1px solid ${CIN.hairline}`,
                flex: { xs: 1, md: 'unset' },
                width: { md: 240 },
                transition: 'border-color .2s ease, box-shadow .2s ease',
                '&:focus-within': {
                  borderColor: CIN.accent,
                  boxShadow: `0 0 0 1px ${CIN.accentGlow}`,
                },
              }}
            >
              <Search style={{ width: 16, height: 16, color: CIN.textMuted, flexShrink: 0 }} />
              <InputBase
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries..."
                fullWidth
                sx={{
                  fontSize: '0.85rem',
                  color: CIN.text,
                  '& input::placeholder': { color: CIN.textMuted, opacity: 1 },
                }}
              />
            </Box>

            <GlowButton component={Link} href="/create/journal" sx={{ flexShrink: 0 }}>
              <Plus style={{ width: 16, height: 16, marginRight: 6 }} />
              New Journal
            </GlowButton>
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
            <JournalCardSkeleton key={i} />
          ))}
        </Box>
      ) : isError ? (
        <Box
          component={motion.div}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            px: 3,
            textAlign: 'center',
            gap: 1.5,
            mx: 'auto',
            maxWidth: 480,
            bgcolor: 'var(--cin-surface, #141419)',
            border: `1px solid ${CIN.hairline}`,
            borderRadius: '16px',
          }}
        >
          <Typography sx={{ ...displaySx, fontSize: '1.4rem' }}>
            Couldn&apos;t load your journals
          </Typography>
          <Typography sx={{ color: CIN.textMuted, maxWidth: 384 }}>
            Something went wrong while loading your journals. Please try again.
          </Typography>
          <GlowButton variant="ghost" onClick={() => refetch()} sx={{ px: 4, mt: 1 }}>
            Try Again
          </GlowButton>
        </Box>
      ) : (
        <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible">
          <JournalNotesList journals={journals} />

          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <GlowButton
                variant="ghost"
                size="large"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                sx={{ px: 4 }}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </GlowButton>
            </Box>
          )}
        </Box>
      )}

      {/* FAB — Write new memory (accent glow pill) */}
      <Link href="/create/journal" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          component={motion.div}
          whileHover={reducedMotion ? undefined : { scale: 1.04 }}
          whileTap={reducedMotion ? undefined : { scale: 0.98 }}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 32 },
            right: { xs: 16, md: 32 },
            bgcolor: CIN.accent,
            color: '#0B0B0F',
            borderRadius: '9999px',
            boxShadow: `0 8px 32px ${CIN.accentGlow}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2.5,
            py: 1.5,
            transition: 'box-shadow 0.2s ease',
            '&:hover': { boxShadow: glowRing(0) },
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
