'use client';

import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import type { Album } from '@/lib/types';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { EmptyState } from '@/components/shared/empty-state';
import { AlbumCard } from './album-card';

/** Responsive album grid with a staggered reveal; dark EmptyState when bare. */
export function AlbumGrid({ albums }: { albums: Album[] }) {
  if (albums.length === 0) {
    return (
      <EmptyState
        icon="camera"
        title="No albums yet"
        description="Create an album to organize your travel memories into collections."
        actionLabel="Create your first album"
        actionHref="/create/album"
      />
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: { xs: 3, md: 4 },
        }}
      >
        {albums.map((album) => (
          <motion.div key={album.id} variants={staggerItem}>
            <AlbumCard album={album} />
          </motion.div>
        ))}
      </Box>
    </motion.div>
  );
}
