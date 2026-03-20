'use client';

import { use } from 'react';
import { Box, Typography } from '@mui/material';
import { usePost } from '@/lib/hooks/use-posts';
import { getMockPost } from '@/lib/mock-data';
import { PostDetail } from '@/components/post/post-detail';
import Skeleton from '@mui/material/Skeleton';

function PostPageSkeleton() {
  return (
    <Box sx={{ minHeight: '100vh', mx: { xs: -2, md: 0 }, mt: { xs: -3, md: 0 } }}>
      {/* Hero skeleton */}
      <Box sx={{ position: 'relative', height: '70vh', minHeight: 500, width: '100%', overflow: 'hidden' }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ position: 'absolute', inset: 0, height: '100%', width: '100%', borderRadius: 0 }} />
        {/* Back button skeleton */}
        <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}>
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 44, width: 44, borderRadius: '50%' }} />
        </Box>
      </Box>

      {/* Content card skeleton */}
      <Box sx={{ position: 'relative', zIndex: 10, mt: -10, mx: 'auto', maxWidth: 672, px: 2, pb: 6 }}>
        <Box sx={{ bgcolor: 'background.paper', borderRadius: '24px', p: { xs: 3, md: 5 }, boxShadow: 4, border: 1, borderColor: 'divider' }}>
          {/* User row skeleton */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Skeleton variant="rounded" animation="pulse" sx={{ height: 40, width: 40, borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 112 }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: 160 }} />
              </Box>
            </Box>
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 32, width: 80, borderRadius: '9999px' }} />
          </Box>

          {/* Caption skeleton */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: '100%' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: '100%' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: '75%' }} />
          </Box>

          {/* Location skeleton */}
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 160, borderRadius: '9999px', mb: 2 }} />

          {/* Tags skeleton */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 80, borderRadius: '9999px' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 64, borderRadius: '9999px' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 96, borderRadius: '9999px' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 72, borderRadius: '9999px' }} />
          </Box>

          {/* Stats skeleton */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 80 }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 96 }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 80 }} />
          </Box>

          <Skeleton variant="rounded" animation="pulse" sx={{ height: 1, width: '100%', mb: 3 }} />

          {/* Comments skeleton */}
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: 128, mb: 2.5 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 28, width: 28, borderRadius: '50%', flexShrink: 0 }} />
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: 96 }} />
                    <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: 64 }} />
                  </Box>
                  <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: '100%' }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: post, isLoading, error } = usePost(id);

  if (isLoading) {
    return <PostPageSkeleton />;
  }

  // Use real data if available, otherwise fall back to mock
  const resolvedPost = post ?? getMockPost(id);

  if (error && !resolvedPost) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>Post not found</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            The post you are looking for does not exist or has been removed.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!resolvedPost) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>Post not found</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            The post you are looking for does not exist or has been removed.
          </Typography>
        </Box>
      </Box>
    );
  }

  return <PostDetail post={resolvedPost} />;
}
