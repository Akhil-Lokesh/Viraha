'use client';

import { Box, Typography, Avatar, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { Users, MapPin, ChevronRight } from 'lucide-react';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

const DEFAULT_COLOR = '#0EA5E9';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

interface KindredTraveler {
  userId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  sharedPlaces: number;
}

function useKindredTravelers() {
  return useQuery({
    queryKey: ['kindred-travelers'],
    queryFn: async (): Promise<KindredTraveler[]> => {
      const res = await apiClient.get('/community/kindred');
      return res.data.data;
    },
    staleTime: 300_000,
  });
}

export function KindredTravelersWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;

  const { data: travelers } = useKindredTravelers();
  const display = (travelers ?? []).slice(0, isWide ? 5 : 3);

  if (display.length === 0) {
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
        <Users style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          Kindred travelers
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Visit more places to discover travelers like you
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
          <Users style={{ width: 12, height: 12, color: hex }} />
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: c.accent,
              textTransform: 'uppercase',
            }}
          >
            Kindred Travelers
          </Typography>
        </Box>
        <Link href="/explore" style={{ textDecoration: 'none' }}>
          <Typography sx={{ fontSize: '0.65rem', color: c.accent, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            Explore <ChevronRight style={{ width: 12, height: 12 }} />
          </Typography>
        </Link>
      </Box>

      {/* Traveler list */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 1.5,
          pb: 1.5,
          display: 'flex',
          flexDirection: isWide ? 'row' : 'column',
          gap: isWide ? 1.5 : 0.5,
        }}
      >
        {display.map((traveler) => (
          <Link
            key={traveler.userId}
            href={`/profile/${traveler.username}`}
            style={{ textDecoration: 'none', color: 'inherit', ...(isWide ? { flex: 1 } : {}) }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                py: isWide ? 1.5 : 0.75,
                px: 1,
                borderRadius: '10px',
                transition: 'background 0.2s',
                '&:hover': { bgcolor: alpha(hex, 0.06) },
                ...(isWide ? { flexDirection: 'column', textAlign: 'center' } : {}),
              }}
            >
              <Avatar
                src={traveler.avatar ? resolveImageUrl(traveler.avatar) : undefined}
                sx={{
                  width: isWide ? 40 : 32,
                  height: isWide ? 40 : 32,
                  border: 2,
                  borderColor: alpha(hex, 0.3),
                  fontSize: '14px',
                }}
              >
                {(traveler.displayName || traveler.username)[0].toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {traveler.displayName || traveler.username}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ...(isWide ? { justifyContent: 'center' } : {}) }}>
                  <MapPin style={{ width: 9, height: 9, color: hex, opacity: 0.6 }} />
                  <Typography sx={{ fontSize: '10px', color: c.accent }}>
                    {traveler.sharedPlaces} shared {traveler.sharedPlaces === 1 ? 'place' : 'places'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Link>
        ))}
      </Box>
    </Box>
  );
}
