'use client';

import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import { CreatePostForm } from '@/components/post/create-post-form';

export default function CreatePostPage() {
  const reduceMotion = useReducedMotion();

  return (
    <Box sx={{ maxWidth: 672, mx: 'auto', pb: 6 }}>
      {/* Page heading */}
      <Box
        component={motion.div}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        sx={{ pt: { xs: 2, md: 4 }, mb: 4 }}
      >
        <Typography sx={{ ...eyebrowSx, mb: 1 }}>New Memory</Typography>
        <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: '1.875rem', md: '2.25rem' }, mb: 0.75 }}>
          Create a Memory
        </Typography>
        <Typography sx={{ color: 'var(--cin-text-muted, #9A9AA6)', fontSize: '0.9375rem' }}>
          Share a moment from your journey
        </Typography>
      </Box>

      {/* Form (sections run their own orchestrated stagger) */}
      <CreatePostForm />
    </Box>
  );
}
