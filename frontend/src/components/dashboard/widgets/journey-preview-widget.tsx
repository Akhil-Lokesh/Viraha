'use client';

import { useEffect, useRef } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { Route, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useJourneys, useDetectJourneys } from '@/lib/hooks/use-journeys';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#8B5CF6';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export function JourneyPreviewWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;
  const isTall = size.rows >= 4;

  const { data: journeys, isLoading } = useJourneys();
  const detect = useDetectJourneys();
  const latest = journeys?.[0];
  const didAutoDetect = useRef(false);

  // Auto-detect journeys on first load if none exist
  useEffect(() => {
    if (!isLoading && journeys && journeys.length === 0 && !didAutoDetect.current) {
      didAutoDetect.current = true;
      detect.mutate(undefined);
    }
  }, [isLoading, journeys]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || detect.isPending) {
    return (
      <Box sx={{ bgcolor: c.bgTint, borderRadius: '16px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Route style={{ width: 24, height: 24, color: hex, opacity: 0.15, animation: 'pulse 2s ease-in-out infinite' }} />
      </Box>
    );
  }

  if (!latest) {
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
        <Route style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          No journeys yet
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Post from your travels and Viraha will connect the dots
        </Typography>
      </Box>
    );
  }

  const posts = latest.journeyPosts ?? [];
  const cities = [...new Set(posts.map((jp) => jp.post?.locationCity).filter(Boolean))];
  const photos = posts
    .map((jp) => jp.post?.mediaThumbnails?.[0] || jp.post?.mediaUrls?.[0])
    .filter(Boolean)
    .slice(0, 6) as string[];

  return (
    <Link href={`/journeys/${latest.id}/timeline`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <Box
        sx={{
          bgcolor: c.bgTint,
          borderRadius: '16px',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'box-shadow 0.2s',
          '&:hover': { boxShadow: 3 },
        }}
      >
        {/* Photo strip */}
        <Box sx={{ display: 'flex', height: isWide ? 100 : 80, flexShrink: 0 }}>
          {photos.length > 0 ? (
            photos.slice(0, isWide ? 4 : 2).map((photo, i) => (
              <Box key={i} sx={{ flex: 1, position: 'relative' }}>
                <Image src={resolveImageUrl(photo)} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                {i === 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(to right, ${alpha(hex, 0.5)} 0%, transparent 50%)`,
                    }}
                  />
                )}
              </Box>
            ))
          ) : (
            <Box sx={{ width: '100%', bgcolor: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Route style={{ width: 24, height: 24, color: hex, opacity: 0.5 }} />
            </Box>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            {/* Header label */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Route style={{ width: 12, height: 12, color: hex }} />
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: c.accent,
                    textTransform: 'uppercase',
                  }}
                >
                  Latest Journey
                </Typography>
              </Box>
              <ChevronRight style={{ width: 14, height: 14, color: hex, opacity: 0.5 }} />
            </Box>

            {/* Title */}
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: isWide ? '1rem' : '0.9rem',
                lineHeight: 1.3,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {latest.title}
            </Typography>
          </Box>

          {/* Meta */}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Calendar style={{ width: 11, height: 11, opacity: 0.5 }} />
              <Typography sx={{ fontSize: '11px', color: 'text.secondary' }}>
                {format(new Date(latest.startDate), 'MMM d')}
                {latest.endDate && ` — ${format(new Date(latest.endDate), 'MMM d, yyyy')}`}
              </Typography>
            </Box>
            {cities.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MapPin style={{ width: 11, height: 11, opacity: 0.4 }} />
                <Typography sx={{ fontSize: '11px', color: 'text.disabled', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {cities.slice(0, 3).join(' · ')}{cities.length > 3 ? ` +${cities.length - 3}` : ''}
                </Typography>
              </Box>
            )}

            {/* Post count indicator */}
            {isTall && (
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, flexWrap: 'wrap' }}>
                {posts.slice(0, 8).map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: alpha(hex, 0.4 + (i / 8) * 0.6),
                    }}
                  />
                ))}
                {posts.length > 8 && (
                  <Typography sx={{ fontSize: '10px', color: 'text.disabled', ml: 0.25 }}>
                    +{posts.length - 8}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Link>
  );
}
