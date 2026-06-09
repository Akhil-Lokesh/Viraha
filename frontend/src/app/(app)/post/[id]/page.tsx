'use client';

import { use } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { MapPin } from 'lucide-react';
import { usePost } from '@/lib/hooks/use-posts';
import { PostDetail } from '@/components/post/post-detail';
import {
  GOLD,
  paper,
  hairline,
  hardShadow,
  EYEBROW_SX,
} from '@/components/post/keepsake';
import Skeleton from '@mui/material/Skeleton';

function PostPageSkeleton() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const bone = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(34,28,24,0.07)';

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

      {/* Postcard content skeleton */}
      <Box sx={{ position: 'relative', zIndex: 10, mt: -10, mx: 'auto', maxWidth: 1040, px: 2, pb: 6 }}>
        <Box
          sx={{
            bgcolor: paper(isDark),
            borderRadius: '8px',
            p: { xs: 3, md: 5 },
            boxShadow: hardShadow(isDark),
            border: `1px solid ${hairline(isDark)}`,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 340px' },
              columnGap: { md: 6 },
            }}
          >
            {/* Main column skeleton */}
            <Box sx={{ minWidth: 0 }}>
              {/* User row skeleton */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant="rounded" animation="pulse" sx={{ height: 40, width: 40, borderRadius: '50%', bgcolor: bone }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 112, bgcolor: bone }} />
                    <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: 160, bgcolor: bone }} />
                  </Box>
                </Box>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 32, width: 80, borderRadius: '9999px', bgcolor: bone }} />
              </Box>

              {/* Eyebrow + stamp skeleton */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: 180, bgcolor: bone }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 140, borderRadius: '3px', bgcolor: bone }} />
              </Box>

              {/* Caption skeleton */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: '100%', bgcolor: bone }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: '100%', bgcolor: bone }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 20, width: '75%', bgcolor: bone }} />
              </Box>

              {/* Tags skeleton */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 80, borderRadius: '3px', bgcolor: bone }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 64, borderRadius: '3px', bgcolor: bone }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 24, width: 96, borderRadius: '3px', bgcolor: bone }} />
              </Box>

              {/* Stats skeleton */}
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: 96, bgcolor: bone }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: 80, bgcolor: bone }} />
              </Box>
            </Box>

            {/* Margin-note column skeleton */}
            <Box
              sx={{
                minWidth: 0,
                borderLeft: { md: `1px dashed ${isDark ? 'rgba(212,168,67,0.3)' : 'rgba(212,168,67,0.5)'}` },
                pl: { md: 4 },
                mt: { xs: 4, md: 0.5 },
              }}
            >
              <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: 110, mb: 2.5, bgcolor: bone }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {[1, 2, 3].map((i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5 }}>
                    <Skeleton variant="rounded" animation="pulse" sx={{ height: 28, width: 28, borderRadius: '50%', flexShrink: 0, bgcolor: bone }} />
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: 96, bgcolor: bone }} />
                        <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: 64, bgcolor: bone }} />
                      </Box>
                      <Skeleton variant="rounded" animation="pulse" sx={{ height: 14, width: '100%', bgcolor: bone }} />
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
              borderRadius: '4px',
              border: `1.5px dashed ${GOLD}`,
              transform: 'rotate(-2deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
            }}
          >
            <MapPin style={{ width: 28, height: 28, color: '#D4A843' }} />
          </Box>
          <Typography sx={{ ...EYEBROW_SX, color: GOLD }}>Lost in transit</Typography>
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
