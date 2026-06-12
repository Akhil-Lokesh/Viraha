'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAlbums } from '@/lib/hooks/use-albums';
import { AlbumGrid } from '@/components/album/album-grid';
import { GlowButton } from '@/components/cinema';
import { CIN, displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import Skeleton from '@mui/material/Skeleton';
import Link from 'next/link';
import { fadeInUp, fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

/** Dark tile skeleton matching the CinemaCard album cover shape. */
function CardSkeleton() {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1px solid ${CIN.hairline}`,
        bgcolor: CIN.surface,
      }}
    >
      <Skeleton
        variant="rectangular"
        animation="pulse"
        sx={{ aspectRatio: '4 / 3', width: '100%', height: 'auto', bgcolor: CIN.surface2 }}
      />
    </Box>
  );
}

export default function AlbumsPage() {
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useAlbums();

  const albums = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box
        component={motion.div}
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        sx={{ pt: { xs: 2, md: 4 }, mb: 5 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'flex-end' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 0 },
          }}
        >
          <Box>
            <Typography sx={{ ...eyebrowSx, mb: 0.75 }}>Collections</Typography>
            <Typography
              component="h1"
              sx={{ ...displaySx, fontSize: { xs: '2.25rem', md: '3rem' } }}
            >
              Albums
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
              Your travel memories, organized into collections.
            </Typography>
          </Box>

          <GlowButton component={Link} href="/create/album" sx={{ flexShrink: 0 }}>
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} />
            Create
          </GlowButton>
        </Box>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box
          component={motion.div}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: { xs: 3, md: 4 },
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} component={motion.div} variants={staggerItem}>
              <CardSkeleton />
            </Box>
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
            textAlign: 'center',
            gap: 1.5,
            py: 8,
            px: 3,
            mx: 'auto',
            maxWidth: 480,
            bgcolor: CIN.surface,
            border: `1px solid ${CIN.hairline}`,
            borderRadius: '16px',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Posterama, var(--font-body)',
              fontWeight: 700,
              fontSize: '1.3rem',
              color: CIN.text,
            }}
          >
            Couldn&apos;t load your albums
          </Typography>
          <Typography variant="body2" sx={{ color: CIN.textMuted, maxWidth: 360 }}>
            Something went wrong while fetching your albums. Please try again.
          </Typography>
          <GlowButton variant="ghost" onClick={() => refetch()} sx={{ mt: 0.5 }}>
            Retry
          </GlowButton>
        </Box>
      ) : (
        <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible">
          <AlbumGrid albums={albums} />

          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
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
    </Box>
  );
}
