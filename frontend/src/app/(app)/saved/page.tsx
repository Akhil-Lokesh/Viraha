'use client';

import { Box, Typography, Skeleton, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { useSavedPosts } from '@/lib/hooks/use-saves';
import { PostGrid } from '@/components/post/post-grid';
import {
  GOLD,
  paper,
  ink,
  hairline,
  hardShadow,
  EYEBROW_SX,
} from '@/components/post/keepsake';
import { fadeInUp, fadeIn } from '@/lib/animations';

export default function SavedPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSavedPosts();

  const posts = data?.pages.flatMap((page) => page.items) ?? [];
  const bone = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(34,28,24,0.07)';

  const stampButton = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 1,
    px: 3,
    py: 1.25,
    borderRadius: '4px',
    border: `1.5px solid ${GOLD}`,
    ...EYEBROW_SX,
    color: ink(isDark),
    bgcolor: 'transparent',
    cursor: 'pointer',
    '&:hover': { bgcolor: isDark ? 'rgba(212,168,67,0.1)' : 'rgba(212,168,67,0.12)' },
    transition: 'background-color 0.2s',
    '&:disabled': { opacity: 0.5 },
  } as const;

  return (
    <Box sx={{ pb: 8, maxWidth: 720, mx: 'auto' }}>
      {/* ── Page Header ───────────────────────────────────── */}
      <Box
        component={motion.div}
        sx={{ pt: { xs: 2, md: 4 }, mb: 4 }}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <Typography sx={{ ...EYEBROW_SX, color: GOLD, mb: 1 }}>
          Kept for later
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: '2.25rem', md: '3rem' },
            fontFamily: 'var(--font-accent)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
            color: ink(isDark),
            mb: 1,
          }}
        >
          Saved
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '1rem' }}>
          Your collection of saved travel memories.
        </Typography>
        <Box
          sx={{
            mt: 3,
            borderTop: `1px dashed ${isDark ? 'rgba(212,168,67,0.3)' : 'rgba(212,168,67,0.5)'}`,
          }}
        />
      </Box>

      {/* ── Content ───────────────────────────────────────── */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 640 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Box
              key={i}
              sx={{
                bgcolor: paper(isDark),
                border: `1px solid ${hairline(isDark)}`,
                borderRadius: '6px',
                boxShadow: hardShadow(isDark),
                overflow: 'hidden',
              }}
            >
              <Box sx={{ px: 1.5, pt: 1.5 }}>
                <Skeleton
                  variant="rounded"
                  animation="pulse"
                  sx={{ aspectRatio: '4/3', height: 'auto', width: '100%', borderRadius: '3px', bgcolor: bone }}
                />
              </Box>
              <Box sx={{ px: 2.5, py: 2 }}>
                <Skeleton variant="text" animation="pulse" sx={{ width: 140, height: 12, bgcolor: bone, mb: 1 }} />
                <Skeleton variant="text" animation="pulse" sx={{ width: '75%', height: 16, bgcolor: bone }} />
                <Skeleton variant="text" animation="pulse" sx={{ width: '33%', height: 16, bgcolor: bone }} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : isError ? (
        <Box
          component={motion.div}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, textAlign: 'center', gap: 1.5 }}
        >
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: '4px',
              border: `1.5px dashed ${GOLD}`,
              transform: 'rotate(-2deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
            }}
          >
            <Bookmark style={{ width: 36, height: 36, color: '#D4A843' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Couldn&apos;t load your saved memories</Typography>
          <Typography sx={{ color: 'text.secondary', maxWidth: 384 }}>
            Something went wrong while loading your saved posts. Please try again.
          </Typography>
          <Box component="button" onClick={() => refetch()} sx={{ ...stampButton, mt: 1 }}>
            Try Again
          </Box>
        </Box>
      ) : posts.length === 0 ? (
        <Box
          component={motion.div}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, textAlign: 'center' }}
        >
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: '4px',
              border: `1.5px dashed ${GOLD}`,
              transform: 'rotate(-2deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Bookmark style={{ width: 36, height: 36, color: '#D4A843' }} />
          </Box>
          <Typography sx={{ ...EYEBROW_SX, color: GOLD, mb: 1 }}>No stamps yet</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>No saved memories yet</Typography>
          <Typography sx={{ color: 'text.secondary', maxWidth: 384 }}>
            When you save posts from other travelers, they will appear here for easy access.
          </Typography>
        </Box>
      ) : (
        <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible">
          <PostGrid posts={posts} />

          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Box
                component="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                sx={stampButton}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
