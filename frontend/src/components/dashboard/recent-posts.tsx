'use client';

import { Box, Typography, Skeleton } from '@mui/material';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useMyPosts } from '@/lib/hooks/use-posts';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Post } from '@/lib/types';
import { PhotoTile, SectionLabel } from '@/components/cinema';
import { eyebrowSx, glowRing } from '@/lib/design/cinema-tokens';
import { staggerItem } from '@/lib/animations';

const MAX_RECENT = 6;

/**
 * The user's recent memories (after the hero) as a grid of glowing PhotoTiles,
 * each linking to its post. Shares the useMyPosts cache with the hero.
 */
export function RecentPosts() {
  const reduceMotion = useReducedMotion();
  const userId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useMyPosts(userId);

  if (isLoading) {
    return (
      <motion.div variants={staggerItem}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 1.5,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              animation="pulse"
              sx={{ height: { xs: 140, md: 180 }, borderRadius: '14px', bgcolor: 'var(--cin-surface-2, #1C1C24)' }}
            />
          ))}
        </Box>
      </motion.div>
    );
  }

  const posts: Post[] = data?.pages.flatMap((p) => p.items) ?? [];
  // posts[0] is already the hero — show what follows it.
  const recent = posts.slice(1, 1 + MAX_RECENT);

  if (recent.length === 0) return null;

  return (
    <motion.div variants={staggerItem}>
      <SectionLabel>Recent memories</SectionLabel>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 1.5,
        }}
      >
        {recent.map((post) => {
          const image = post.mediaThumbnails[0] || post.mediaUrls[0];
          const place = post.locationName || post.locationCity || post.locationCountry || 'Untitled memory';
          return (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              aria-label={`Open memory: ${place}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <motion.div
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                style={{ borderRadius: 14 }}
              >
                <PhotoTile
                  src={image}
                  alt={place}
                  sx={{
                    height: { xs: 140, md: 180 },
                    cursor: 'pointer',
                    transition: 'box-shadow .2s ease',
                    '&:hover': { boxShadow: glowRing(1) },
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      p: 1.5,
                    }}
                  >
                    <Typography
                      noWrap
                      sx={{ ...eyebrowSx, fontSize: 10, color: 'var(--cin-text, #F4F4F6)' }}
                    >
                      {place}
                    </Typography>
                  </Box>
                </PhotoTile>
              </motion.div>
            </Link>
          );
        })}
      </Box>
    </motion.div>
  );
}
