'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAlbums } from '@/lib/hooks/use-albums';
import { AlbumGrid } from '@/components/album/album-grid';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Link from 'next/link';
import { fadeInUp, fadeIn, staggerContainer, staggerItem } from '@/lib/animations';

const GOLD = 'var(--viraha-gold, #D4A843)';

const eyebrowSx = {
  fontFamily: 'var(--font-brand)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: GOLD,
} as const;

/** Skeleton shaped like the photo-stack cards. */
function StackSkeleton() {
  return (
    <Box sx={{ position: 'relative', pt: '10px', px: '8px' }}>
      <Skeleton
        variant="rounded"
        animation="pulse"
        sx={{
          position: 'absolute',
          top: 0,
          left: 14,
          right: 14,
          height: '55%',
          transform: 'rotate(-2.5deg)',
          borderRadius: '4px',
          opacity: 0.4,
        }}
      />
      <Skeleton
        variant="rounded"
        animation="pulse"
        sx={{ aspectRatio: '4/3', borderRadius: '4px', width: '100%' }}
      />
      <Skeleton variant="rounded" animation="pulse" sx={{ height: 18, width: '60%', mt: 1.5, borderRadius: '2px' }} />
      <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: '35%', mt: 1, borderRadius: '2px' }} />
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
            <Typography sx={{ ...eyebrowSx, mb: 0.75 }}>The Shelf — Collections</Typography>
            <Typography
              component="h1"
              sx={(theme) => ({
                fontSize: { xs: '2.25rem', md: '3rem' },
                fontFamily: 'var(--font-accent)',
                letterSpacing: '0.005em',
                lineHeight: 1.05,
                color:
                  theme.palette.mode === 'dark'
                    ? 'var(--viraha-ink-dark, #F2EAD9)'
                    : 'var(--viraha-ink, #221C18)',
              })}
            >
              Albums
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
              Your travel memories, organized into collections.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            disableElevation
            component={Link}
            href="/create/album"
            sx={{
              borderRadius: '4px',
              flexShrink: 0,
              px: 2.5,
              py: 1.25,
              fontSize: '0.85rem',
              fontWeight: 600,
              borderColor: GOLD,
              color: 'text.primary',
              '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
            }}
          >
            <Plus style={{ width: 16, height: 16, marginRight: 6 }} />
            Create
          </Button>
        </Box>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box
          component={motion.div}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
            columnGap: 3,
            rowGap: 4.5,
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} component={motion.div} variants={staggerItem}>
              <StackSkeleton />
            </Box>
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
            textAlign: 'center',
            gap: 1.5,
            py: 8,
            mx: 'auto',
            maxWidth: 480,
            border: '1px dashed',
            borderColor:
              theme.palette.mode === 'dark' ? 'rgba(242,234,217,0.25)' : 'rgba(34,28,24,0.25)',
            borderRadius: '6px',
          })}
        >
          <Typography
            sx={{ fontFamily: 'var(--font-accent)', fontSize: '1.4rem', color: 'text.primary' }}
          >
            Couldn&apos;t load your albums
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360 }}>
            Something went wrong while fetching your albums. Please try again.
          </Typography>
          <Button
            variant="outlined"
            disableElevation
            onClick={() => refetch()}
            sx={{
              borderRadius: '4px',
              mt: 0.5,
              borderColor: GOLD,
              color: 'text.primary',
              fontWeight: 600,
              '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
            }}
          >
            Retry
          </Button>
        </Box>
      ) : (
        <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible">
          <AlbumGrid albums={albums} />

          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
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
    </Box>
  );
}
