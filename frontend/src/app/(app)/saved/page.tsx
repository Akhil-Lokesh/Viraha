'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { useSavedPosts } from '@/lib/hooks/use-saves';
import { PostGrid } from '@/components/post/post-grid';
import Button from '@mui/material/Button';
import { fadeInUp, fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

export default function SavedPage() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSavedPosts();

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── Page Header ───────────────────────────────────── */}
      <Box
        component={motion.div}
        sx={{ pt: { xs: 2, md: 4 }, mb: 4 }}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <Typography
          sx={{
            fontSize: { xs: '1.875rem', md: '2.25rem' },
            fontWeight: 'bold',
            letterSpacing: '-0.01em',
            mb: 1,
          }}
        >
          Saved
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '1rem' }}>
          Your collection of saved travel memories.
        </Typography>
      </Box>

      {/* ── Content ───────────────────────────────────────── */}
      {isLoading ? (
        <Box
          component={motion.div}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
            gap: 3,
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} component={motion.div} variants={staggerItem}>
              <Box sx={{ aspectRatio: '4/3', borderRadius: '16px', bgcolor: 'action.selected' }} />
              <Box sx={{ px: 0.5, mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ height: 16, bgcolor: 'action.selected', borderRadius: 1, width: '75%' }} />
                <Box sx={{ height: 12, bgcolor: 'action.selected', borderRadius: 1, width: '33%' }} />
              </Box>
            </Box>
          ))}
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
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'action.selected',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Bookmark style={{ width: 40, height: 40, color: 'var(--mui-palette-text-secondary)' }} />
          </Box>
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
    </Box>
  );
}
