'use client';

import { Box, Typography } from '@mui/material';
import { CreateAlbumForm } from '@/components/album/create-album-form';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

export default function CreateAlbumPage() {
  return (
    <Box sx={{ maxWidth: 576, mx: 'auto', pb: 6 }}>
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
          Create Album
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '1rem' }}>
          Organize your travel memories into collections.
        </Typography>
      </Box>
      <CreateAlbumForm />
    </Box>
  );
}
