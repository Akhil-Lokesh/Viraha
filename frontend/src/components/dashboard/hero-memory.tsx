'use client';

import { Box, Typography, Skeleton } from '@mui/material';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useMyPosts } from '@/lib/hooks/use-posts';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Post } from '@/lib/types';
import { PhotoTile, CinemaCard, SectionLabel } from '@/components/cinema';
import { EmptyState } from '@/components/shared/empty-state';
import { eyebrowSx } from '@/lib/design/cinema-tokens';
import { staggerItem } from '@/lib/animations';

/** Null when the backend redacted the post's location (hidden lat/lng). */
function formatCoordinates(lat: number | null, lng: number | null): string | null {
  if (typeof lat !== 'number' || !Number.isFinite(lat)) return null;
  if (typeof lng !== 'number' || !Number.isFinite(lng)) return null;
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

/**
 * Hero "latest memory" — the user's own most recent post as a full-bleed
 * cinematic frame. The photo is the light source; caption sits in the vignette.
 */
export function HeroMemory() {
  const reduceMotion = useReducedMotion();
  const userId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useMyPosts(userId);

  const latest: Post | undefined = data?.pages[0]?.items[0];

  if (isLoading) {
    return (
      <motion.div variants={staggerItem}>
        <CinemaCard hover={false}>
          <Skeleton
            variant="rectangular"
            animation="pulse"
            sx={{
              width: '100%',
              height: { xs: 260, sm: 340, md: 440 },
              bgcolor: 'var(--cin-surface-2, #1C1C24)',
            }}
          />
        </CinemaCard>
      </motion.div>
    );
  }

  if (!latest) {
    return (
      <motion.div variants={staggerItem}>
        <CinemaCard hover={false}>
          <EmptyState
            icon="camera"
            title="Your first memory awaits"
            description="Post a memory and it will premiere here, front and center."
            actionLabel="Post your first memory"
            actionHref="/create/post"
          />
        </CinemaCard>
      </motion.div>
    );
  }

  const image = latest.mediaThumbnails[0] || latest.mediaUrls[0];
  const place = latest.locationName || latest.locationCity || latest.locationCountry || 'Somewhere on the map';
  const regionLabel = latest.locationCity || latest.locationCountry;
  const coordsLabel = formatCoordinates(latest.locationLat, latest.locationLng);
  const postedDate = new Date(latest.postedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div variants={staggerItem}>
      <SectionLabel>Latest memory</SectionLabel>

      <Link
        href={`/post/${latest.id}`}
        aria-label={`Open latest memory: ${place}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <motion.div
          whileHover={reduceMotion ? undefined : { scale: 1.015 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <CinemaCard sx={{ cursor: 'pointer' }}>
            <PhotoTile
              src={image}
              alt={place}
              rounded={0}
              sx={{ height: { xs: 260, sm: 340, md: 440 } }}
            >
              {/* Region chip — quiet dark glass, top-right */}
              {regionLabel && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: '999px',
                    bgcolor: 'rgba(11,11,15,0.55)',
                    border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <Typography component="span" sx={{ ...eyebrowSx, fontSize: 10, color: 'var(--cin-text, #F4F4F6)' }}>
                    {regionLabel}
                  </Typography>
                </Box>
              )}

              {/* Caption + location over the bottom vignette */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  p: { xs: 2, md: 3 },
                }}
              >
                {coordsLabel && (
                  <Typography component="p" sx={{ ...eyebrowSx, fontSize: 10, mb: 0.75 }}>
                    {coordsLabel}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
                  <Typography
                    component="h3"
                    noWrap
                    sx={{
                      fontFamily: 'Posterama, var(--font-body)',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      color: 'var(--cin-text, #F4F4F6)',
                      fontSize: { xs: '1.35rem', md: '1.75rem' },
                      lineHeight: 1.1,
                      minWidth: 0,
                    }}
                  >
                    {place}
                  </Typography>
                  <Typography
                    component="span"
                    suppressHydrationWarning
                    sx={{ ...eyebrowSx, fontSize: 10, flexShrink: 0 }}
                  >
                    {postedDate}
                  </Typography>
                </Box>
                {latest.caption && (
                  <Typography
                    sx={{
                      color: 'rgba(244,244,246,0.78)',
                      mt: 0.75,
                      fontSize: '0.95rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {latest.caption}
                  </Typography>
                )}
              </Box>
            </PhotoTile>
          </CinemaCard>
        </motion.div>
      </Link>
    </motion.div>
  );
}
