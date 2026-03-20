'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { CreatePostForm } from '@/components/post/create-post-form';

export default function CreatePostPage() {
  return (
    <AuthGuard>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        sx={{ maxWidth: 672, mx: 'auto' }}
      >
        {/* Page heading */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box
              component={motion.div}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)',
              }}
            >
              <Sparkles style={{ height: 20, width: 20, color: 'var(--mui-palette-primary-main)' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'text.primary' }}>
                Create a Memory
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Share a moment from your journey
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Form */}
        <CreatePostForm />
      </Box>
    </AuthGuard>
  );
}
