'use client';

import { Box, Typography, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import { useSavedPosts } from '@/lib/hooks/use-saves';
import { PostGrid } from '@/components/post/post-grid';
import { EmptyState } from '@/components/shared/empty-state';
import { GlowButton } from '@/components/cinema';
import { eyebrowSx, displaySx } from '@/lib/design/cinema-tokens';
import { staggerContainer, staggerItem, fadeIn } from '@/lib/animations';

const SKELETON_SX = { bgcolor: 'var(--cin-surface-2, #1C1C24)' } as const;

function SavedSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 640 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            bgcolor: 'var(--cin-surface, #141419)',
            border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <Skeleton
            variant="rectangular"
            animation="pulse"
            sx={{ ...SKELETON_SX, aspectRatio: '4/3', height: 'auto', width: '100%' }}
          />
          <Box sx={{ px: 2.5, py: 2 }}>
            <Skeleton variant="text" animation="pulse" sx={{ ...SKELETON_SX, width: 140, height: 12, mb: 1 }} />
            <Skeleton variant="text" animation="pulse" sx={{ ...SKELETON_SX, width: '75%', height: 16 }} />
            <Skeleton variant="text" animation="pulse" sx={{ ...SKELETON_SX, width: '33%', height: 16 }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function SavedPage() {
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSavedPosts();

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Box
      component={motion.div}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      sx={{ pb: 8, maxWidth: 720, mx: 'auto' }}
    >
      {/* Page header */}
      <Box component={motion.div} variants={staggerItem} sx={{ pt: { xs: 2, md: 4 }, mb: 4 }}>
        <Typography sx={{ ...eyebrowSx, mb: 1 }}>Kept for later</Typography>
        <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: 36, md: 48 }, mb: 1 }}>
          Saved
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted, #9A9AA6)', fontSize: '1rem' }}>
          Your collection of saved travel memories.
        </Typography>
        <Box sx={{ mt: 3, borderTop: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))' }} />
      </Box>

      {/* Content */}
      {isLoading ? (
        <SavedSkeleton />
      ) : isError ? (
        <Box component={motion.div} variants={staggerItem}>
          <EmptyState
            icon="camera"
            title="Couldn't load your saved memories"
            description="Something went wrong while loading your saved posts. Please try again."
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: -6 }}>
            <GlowButton variant="ghost" onClick={() => refetch()}>
              Try Again
            </GlowButton>
          </Box>
        </Box>
      ) : posts.length === 0 ? (
        <Box component={motion.div} variants={staggerItem}>
          <EmptyState
            icon="camera"
            title="No saved memories yet"
            description="When you save posts from other travelers, they will appear here for easy access."
            actionLabel="Explore posts"
            actionHref="/explore"
          />
        </Box>
      ) : (
        <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible">
          <PostGrid posts={posts} />

          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <GlowButton
                variant="ghost"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </GlowButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
