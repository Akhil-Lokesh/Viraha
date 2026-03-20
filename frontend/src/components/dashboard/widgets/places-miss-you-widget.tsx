'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import { Heart, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { usePlaceResonance } from '@/lib/hooks/use-viraha';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#EC4899';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export function PlacesMissYouWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;
  const isTall = size.rows >= 4;

  const { data: places } = usePlaceResonance();

  // Show places with high resonance that haven't been visited recently
  const missedPlaces = (places ?? [])
    .filter((p) => {
      const daysSince = (Date.now() - new Date(p.latestVisit).getTime()) / 86400000;
      return daysSince > 60 && p.resonance > 0.15;
    })
    .sort((a, b) => b.resonance - a.resonance)
    .slice(0, isWide ? 4 : 3);

  if (missedPlaces.length === 0) {
    return (
      <Box
        sx={{
          bgcolor: c.bgTint,
          borderRadius: '16px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1,
          p: 2,
        }}
      >
        <Heart style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          All caught up
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          No places are missing you right now
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: c.bgTint,
        borderRadius: '16px',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Heart style={{ width: 12, height: 12, color: hex }} />
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: c.accent,
              textTransform: 'uppercase',
            }}
          >
            Places That Miss You
          </Typography>
        </Box>
        <Link href="/map" style={{ textDecoration: 'none' }}>
          <Typography sx={{ fontSize: '0.7rem', color: c.accent, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            Map <ChevronRight style={{ width: 12, height: 12 }} />
          </Typography>
        </Link>
      </Box>

      {/* Place cards */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 1.5,
          pb: 1.5,
          display: 'flex',
          flexDirection: isWide ? 'row' : 'column',
          gap: 1,
        }}
      >
        {missedPlaces.map((place) => {
          const timeAgo = formatDistanceToNow(new Date(place.latestVisit), { addSuffix: false });
          const warmthWidth = Math.round(place.resonance * 100);

          return (
            <Box
              key={`${place.locationCity}-${place.locationCountry}`}
              sx={{
                display: 'flex',
                gap: 1.5,
                p: 1,
                borderRadius: '10px',
                transition: 'background 0.2s',
                '&:hover': { bgcolor: alpha(hex, 0.08) },
                ...(isWide ? { flex: 1, flexDirection: 'column', textAlign: 'center' } : {}),
              }}
            >
              {/* Thumbnail */}
              {place.thumbnail && (
                <Box
                  sx={{
                    width: isWide ? '100%' : 48,
                    height: isWide ? 60 : 48,
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <Image src={resolveImageUrl(place.thumbnail)} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                  {/* Warmth overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: `${warmthWidth}%`,
                      height: 3,
                      bgcolor: hex,
                      borderRadius: '0 4px 0 0',
                    }}
                  />
                </Box>
              )}

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {place.locationCity}
                </Typography>
                <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
                  {place.locationCountry}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      bgcolor: alpha(hex, 0.5),
                      animation: 'pulse 3s ease-in-out infinite',
                    }}
                  />
                  <Typography sx={{ fontSize: '10px', color: 'text.disabled', fontStyle: 'italic' }}>
                    {timeAgo} ago
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
