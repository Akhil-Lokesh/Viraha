'use client';

import { Box, Typography, Skeleton, useTheme } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Stamp } from 'lucide-react';
import { useMyPosts } from '@/lib/hooks/use-posts';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Post } from '@/lib/types';
import { getJournalTokens, eyebrowSx, displaySerifSx, spreadItem } from './journal-tokens';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

/** Null when the backend redacted the post's location (hidden lat/lng). */
function formatCoordinates(lat: number | null, lng: number | null): string | null {
  if (typeof lat !== 'number' || !Number.isFinite(lat)) return null;
  if (typeof lng !== 'number' || !Number.isFinite(lng)) return null;
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${ew}`;
}

/**
 * Hero "latest memory" postcard — the opening artifact of the journal spread.
 */
export function HeroMemory() {
  const theme = useTheme();
  const t = getJournalTokens(theme.palette.mode === 'dark' ? 'dark' : 'light');
  const userId = useAuthStore((s) => s.user?.id);
  const { data, isLoading } = useMyPosts(userId);

  const latest: Post | undefined = data?.pages[0]?.items[0];

  if (isLoading) {
    return (
      <motion.div variants={spreadItem}>
        <Box
          sx={{
            border: '1px solid',
            borderColor: t.inkHairline,
            bgcolor: t.paper,
            backgroundImage: t.grain,
            borderRadius: '4px',
            p: 1.5,
            pb: 7,
            boxShadow: '3px 3px 0 rgba(34,28,24,0.08)',
          }}
        >
          <Skeleton
            variant="rectangular"
            animation="pulse"
            sx={{ width: '100%', height: { xs: 240, md: 380 }, borderRadius: '2px', bgcolor: t.inkHairline }}
          />
          <Skeleton variant="text" animation="pulse" sx={{ width: 180, mt: 2, bgcolor: t.inkHairline }} />
        </Box>
      </motion.div>
    );
  }

  if (!latest) return <EmptyHero gold={t.gold} ink={t.ink} inkSoft={t.inkSoft} paper={t.paper} grain={t.grain} goldHairline={t.goldHairline} />;

  const image = latest.mediaThumbnails[0] || latest.mediaUrls[0];
  const place = latest.locationName || latest.locationCity || latest.locationCountry || 'Somewhere on the map';
  const stampLabel = latest.locationCity || latest.locationCountry;
  const coordsLabel = formatCoordinates(latest.locationLat, latest.locationLng);
  const postedDate = new Date(latest.postedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div variants={spreadItem}>
      <Typography component="p" sx={{ ...eyebrowSx, color: t.inkSoft, mb: 1.5 }}>
        Latest entry
      </Typography>

      <Link href={`/post/${latest.id}`} aria-label={`Open latest memory: ${place}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <Box
          component={motion.div}
          whileHover={{ rotate: -0.75, scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          sx={{
            position: 'relative',
            border: '1px solid',
            borderColor: t.inkHairline,
            bgcolor: t.paper,
            backgroundImage: t.grain,
            borderRadius: '4px',
            p: { xs: 1.25, md: 1.5 },
            boxShadow: '3px 3px 0 rgba(34,28,24,0.10)',
            cursor: 'pointer',
          }}
        >
          {/* Photo */}
          <Box sx={{ position: 'relative', width: '100%', height: { xs: 240, sm: 320, md: 400 }, overflow: 'hidden', borderRadius: '2px' }}>
            {image ? (
              <Image src={resolveImageUrl(image)} alt={place} fill style={{ objectFit: 'cover' }} unoptimized priority />
            ) : (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed',
                  borderColor: t.goldHairline,
                }}
              >
                <MapPin style={{ width: 32, height: 32, color: t.gold, opacity: 0.6 }} />
              </Box>
            )}

            {/* Location stamp — rotated, gold border */}
            {stampLabel && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  transform: 'rotate(2deg)',
                  border: '1.5px solid',
                  borderColor: 'var(--viraha-gold, #D4A843)',
                  color: '#FFF',
                  bgcolor: 'rgba(22,18,31,0.55)',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: '3px',
                }}
              >
                <Typography component="span" sx={{ ...eyebrowSx, fontSize: '10px', color: 'inherit' }}>
                  {stampLabel}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Postcard caption block — thick bottom padding */}
          <Box sx={{ pt: 2, pb: { xs: 2, md: 2.5 }, px: 0.5 }}>
            {coordsLabel && (
              <Typography component="p" sx={{ ...eyebrowSx, color: t.gold, mb: 0.75 }}>
                {coordsLabel}
              </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
              <Typography
                component="h2"
                sx={{ ...displaySerifSx, color: t.ink, fontSize: { xs: '1.5rem', md: '1.9rem' }, minWidth: 0 }}
                noWrap
              >
                {place}
              </Typography>
              <Typography
                component="span"
                suppressHydrationWarning
                sx={{ ...eyebrowSx, fontSize: '10px', color: t.inkSoft, flexShrink: 0 }}
              >
                {postedDate}
              </Typography>
            </Box>
            {latest.caption && (
              <Typography
                sx={{
                  color: t.inkSoft,
                  mt: 0.75,
                  fontSize: '0.95rem',
                  fontStyle: 'italic',
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
        </Box>
      </Link>
    </motion.div>
  );
}

interface EmptyHeroProps {
  gold: string;
  ink: string;
  inkSoft: string;
  paper: string;
  grain: string;
  goldHairline: string;
}

function EmptyHero({ gold, ink, inkSoft, paper, grain, goldHairline }: EmptyHeroProps) {
  return (
    <motion.div variants={spreadItem}>
      <Box
        sx={{
          border: '1.5px dashed',
          borderColor: goldHairline,
          bgcolor: paper,
          backgroundImage: grain,
          borderRadius: '4px',
          px: 3,
          py: { xs: 6, md: 9 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: '1.5px solid',
            borderColor: gold,
            transform: 'rotate(-4deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 0.5,
          }}
        >
          <Stamp style={{ width: 26, height: 26, color: gold }} />
        </Box>
        <Typography component="h2" sx={{ ...displaySerifSx, color: ink, fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
          No stamps yet
        </Typography>
        <Typography sx={{ color: inkSoft, maxWidth: 380 }}>
          Your journal is waiting for its first page. Post a memory and it will appear here as a postcard.
        </Typography>
        <Link href="/create/post" style={{ textDecoration: 'none' }}>
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              mt: 1,
              px: 2.5,
              py: 1,
              border: '1.5px solid',
              borderColor: gold,
              borderRadius: '3px',
              color: gold,
              ...eyebrowSx,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(212,168,67,0.1)' },
              transition: 'background-color 0.2s',
            }}
          >
            Post your first memory
          </Box>
        </Link>
      </Box>
    </motion.div>
  );
}
