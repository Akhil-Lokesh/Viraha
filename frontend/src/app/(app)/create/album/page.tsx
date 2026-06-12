'use client';

import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import { CreateAlbumForm } from '@/components/album/create-album-form';

export default function CreateAlbumPage() {
  const reduceMotion = useReducedMotion();

  return (
    <Box sx={{ maxWidth: 576, mx: 'auto', pb: 6 }}>
      <Box
        component={motion.div}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        sx={{ pt: { xs: 2, md: 4 }, mb: 4 }}
      >
        <Typography sx={{ ...eyebrowSx, mb: 1 }}>Collections</Typography>
        <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: '1.875rem', md: '2.25rem' }, mb: 0.75 }}>
          Create Album
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted, #9A9AA6)', fontSize: '0.9375rem' }}>
          Organize your travel memories into collections.
        </Typography>
      </Box>
      <Box
        component={motion.div}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: reduceMotion ? 0 : 0.05 }}
      >
        <CreateAlbumForm />
      </Box>
    </Box>
  );
}
