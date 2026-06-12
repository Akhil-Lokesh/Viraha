'use client';

import { use } from 'react';
import { Box, Typography } from '@mui/material';
import { MapPin } from 'lucide-react';
import { usePost } from '@/lib/hooks/use-posts';
import { PostDetail } from '@/components/post/post-detail';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';
import Skeleton from '@mui/material/Skeleton';

const BONE = 'rgba(255,255,255,0.06)';

function PostPageSkeleton() {
  return (
    <Box sx={{ minHeight: '100vh', mx: { xs: -2, md: 0 }, mt: { xs: -3, md: 0 } }}>
      {/* Hero skeleton */}
      <Box sx={{ position: 'relative', height: '70vh', minHeight: 500, width: '100%', overflow: 'hidden', bgcolor: CIN.surface }}>
        <Skeleton variant="rounded" animation="pulse" sx={{ position: 'absolute', inset: 0, height: '100%', width: '100%', borderRadius: 0, bgcolor: BONE }} />
        {/* Back button skeleton */}
        <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 20 }}>
          <Skeleton variant="rounded" animation="pulse" sx={{ height: 44, width: 44, borderRadius: '50%', bgcolor: BONE }} />
        </Box>
      </Box>

      {/* Content surface skeleton */}
      <Box sx={{ position: 'relative', zIndex: 10, mt: -9, mx: 'auto', maxWidth: 1100, px: 2, pb: 6 }}>
        <Box
          sx={{
            bgcolor: CIN.surface,
            borderRadius: '16px',
            p: { xs: 3, md: 5 },
            border: `1px solid ${CIN.hairline}`,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' },
              columnGap: { lg: 6 },
            }}
          >
            {/* Main column skeleton */}
            <Box sx={{ minWidth: 0 }}>
              {/* User row skeleton */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant="rounded" animation="pulse" sx={{ height: 40, width: 40, borderRadius: '50%', bgcolor: BONE }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 112, bgcolor: BONE }} />
                    <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: 160, bgcolor: BONE }} />
                  </Box>
                </Box>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 32, width: 80, borderRadius: '9999px', bgcolor: BONE }} />
              </Box>

              {/* Location microlabel skeleton */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 160, borderRadius: '9999px', bgcolor: BONE }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 140, bgcolor: BONE }} />
              </Box>

              {/* Caption skeleton */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: '100%', bgcolor: BONE }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: '100%', bgcolor: BONE }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: '75%', bgcolor: BONE }} />
              </Box>

              {/* Tags skeleton */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 80, borderRadius: '9999px', bgcolor: BONE }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 64, borderRadius: '9999px', bgcolor: BONE }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 96, borderRadius: '9999px', bgcolor: BONE }} />
              </Box>

              {/* Stats skeleton */}
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: 96, bgcolor: BONE }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: 80, bgcolor: BONE }} />
              </Box>
            </Box>

            {/* Side-column (comments) skeleton */}
            <Box
              sx={{
                minWidth: 0,
                borderLeft: { lg: `1px solid ${CIN.hairline}` },
                pl: { lg: 4 },
                mt: { xs: 4, lg: 0.5 },
              }}
            >
              <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: 110, mb: 2.5, bgcolor: BONE }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {[1, 2, 3].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5 }}>
                    <Skeleton variant="rounded" animation="pulse" sx={{ height: 28, width: 28, borderRadius: '50%', flexShrink: 0, bgcolor: BONE }} />
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: 96, bgcolor: BONE }} />
                        <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: 64, bgcolor: BONE }} />
                      </Box>
                      <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: '100%', bgcolor: BONE }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
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
  const { data: post, isLoading } = usePost(id);

  if (isLoading) {
    return <PostPageSkeleton />;
  }

  if (!post) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '16px',
              bgcolor: CIN.surface2,
              border: `1px solid ${CIN.hairline}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
            }}
          >
            <MapPin style={{ width: 28, height: 28, color: CIN.accent }} />
          </Box>
          <Typography sx={{ ...eyebrowSx }}>Lost in transit</Typography>
          <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>Post not found</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            The post you are looking for does not exist or has been removed.
          </Typography>
        </Box>
      </Box>
    );
  }

  return <PostDetail post={post} />;
}
