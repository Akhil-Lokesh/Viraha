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

export default function AlbumsPage() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
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
        sx={{ pt: { xs: 2, md: 4 }, mb: 4 }}
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
              borderRadius: '12px',
              flexShrink: 0,
              px: 2.5,
              py: 1.25,
              fontSize: '0.85rem',
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
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
            gap: 2.5,
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} component={motion.div} variants={staggerItem}>
              <Skeleton
                variant="rounded"
                animation="pulse"
                sx={{ aspectRatio: '4/3', borderRadius: '16px', width: '100%' }}
              />
            </Box>
          ))}
        </Box>
      ) : (
        <Box component={motion.div} variants={fadeIn} initial="hidden" animate="visible">
          <AlbumGrid albums={albums} />

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
