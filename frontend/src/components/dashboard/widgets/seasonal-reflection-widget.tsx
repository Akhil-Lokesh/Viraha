'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { Leaf, MapPin, Camera, BookOpen, ChevronRight } from 'lucide-react';
import { AnimatedCounter } from '../animated-counter';
import { useSeasonalReflection } from '@/lib/hooks/use-atlas';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#D97706';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const SEASON_ICONS: Record<string, string> = {
  Winter: '❄️',
  Spring: '🌸',
  Summer: '☀️',
  Autumn: '🍂',
};

export function SeasonalReflectionWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;
  const isTall = size.rows >= 4;

  const { data: reflection } = useSeasonalReflection();

  if (!reflection) {
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
        <Leaf style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          Seasonal reflection loading...
        </Typography>
      </Box>
    );
  }

  const { season, year, stats, highlights } = reflection;
  const seasonIcon = SEASON_ICONS[season] || '🌍';

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
          <Typography sx={{ fontSize: '14px' }}>{seasonIcon}</Typography>
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: c.accent,
              textTransform: 'uppercase',
            }}
          >
            {season} {year}
          </Typography>
        </Box>
        <Link href="/create/journal" style={{ textDecoration: 'none' }}>
          <Typography sx={{ fontSize: '0.65rem', color: c.accent, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            Reflect <ChevronRight style={{ width: 12, height: 12 }} />
          </Typography>
        </Link>
      </Box>

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: isWide ? 3 : 1.5, px: 2, py: 1, flexShrink: 0 }}>
        {[
          { value: stats.postsCreated, label: 'Posts', icon: Camera },
          { value: stats.newCitiesVisited, label: 'New Cities', icon: MapPin },
          { value: stats.journalsWritten, label: 'Journals', icon: BookOpen },
        ].map(({ value, label, icon: Icon }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Icon style={{ width: 12, height: 12, color: hex, opacity: 0.7 }} />
            <Box>
              <AnimatedCounter
                value={value}
                sx={{ fontSize: '1.1rem', fontWeight: 800, color: c.accent, lineHeight: 1 }}
              />
              <Typography sx={{ fontSize: '9px', color: 'text.disabled', lineHeight: 1 }}>
                {label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Highlight photo grid */}
      {highlights.length > 0 && (
        <Box
          sx={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: isWide ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: 0.5,
            px: 1.5,
            pb: 1.5,
            minHeight: 0,
          }}
        >
          {highlights.slice(0, isWide ? 6 : isTall ? 6 : 4).map((h) => (
            h.thumbnail && (
              <Link key={h.id} href={`/post/${h.id}`} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    aspectRatio: '1',
                    '&:hover img': { transform: 'scale(1.05)' },
                  }}
                >
                  <Image
                    src={resolveImageUrl(h.thumbnail)}
                    alt={h.caption || ''}
                    fill
                    style={{ objectFit: 'cover', transition: 'transform 0.2s' }}
                    unoptimized
                  />
                </Box>
              </Link>
            )
          ))}
        </Box>
      )}

      {/* Prompt to reflect */}
      {stats.postsCreated > 0 && (
        <Box sx={{ px: 2, pb: 1.5, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '11px', color: 'text.secondary', fontStyle: 'italic' }}>
            This {season.toLowerCase()}, you visited {stats.newCitiesVisited} new {stats.newCitiesVisited === 1 ? 'city' : 'cities'} and captured {stats.postsCreated} {stats.postsCreated === 1 ? 'memory' : 'memories'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
