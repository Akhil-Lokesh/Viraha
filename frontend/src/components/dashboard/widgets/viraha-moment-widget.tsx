'use client';

import { Box, Typography, useTheme, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, MapPin, Clock, Calendar } from 'lucide-react';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { useMoments } from '@/lib/hooks/use-viraha';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#8B5CF6';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const TYPE_LABELS: Record<string, string> = {
  on_this_day: 'On This Day',
  place_anniversary: 'Place Anniversary',
  seasonal_echo: 'Seasonal Echo',
  weather_match: 'Weather Match',
  recent_highlight: 'Recent Memory',
};

export function VirahaMomentWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;

  const { data: moments, isLoading } = useMoments();

  if (isLoading) {
    return (
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', height: '100%', bgcolor: c.bgTint }}>
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  const items = moments ?? [];

  if (items.length === 0) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          bgcolor: c.bgTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1,
          p: 2,
        }}
      >
        <Sparkles style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          Viraha is listening
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Memories will surface as you travel more
        </Typography>
      </Box>
    );
  }

  // Card list layout
  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        height: '100%',
        bgcolor: c.bgTint,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ px: 2, pt: 1.5, pb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Sparkles style={{ width: 14, height: 14, color: hex }} />
        <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: hex, textTransform: 'uppercase' }}>
          Viraha Moments
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, pb: 1.5, display: 'flex', flexDirection: isWide ? 'row' : 'column', gap: 1 }}>
        {items.slice(0, isWide ? 4 : 3).map((moment) => {
          const href = moment.referenceType === 'journal_entry'
            ? `/journals/${moment.referenceId}`
            : `/post/${moment.referenceId}`;
          const image = moment.thumbnail ? resolveImageUrl(moment.thumbnail) : null;

          return (
            <Link key={moment.id} href={href} style={{ textDecoration: 'none', color: 'inherit', flex: isWide ? 1 : undefined }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  p: 1,
                  borderRadius: '10px',
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: alpha(hex, 0.08) },
                  ...(isWide ? { flexDirection: 'column', alignItems: 'center', textAlign: 'center' } : {}),
                }}
              >
                {image && (
                  <Box
                    sx={{
                      width: isWide ? '100%' : 48,
                      height: isWide ? 80 : 48,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    <Image src={image} alt={moment.title} fill style={{ objectFit: 'cover' }} unoptimized />
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: hex,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      mb: 0.25,
                    }}
                  >
                    {TYPE_LABELS[moment.type] || moment.type}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'text.primary',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {moment.title}
                  </Typography>
                  {moment.locationName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.5 }}>
                      <MapPin style={{ width: 9, height: 9, color: theme.palette.text.disabled }} />
                      <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
                        {moment.locationName}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
}
