'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Compass, MapPin, Star, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useWantToGo } from '@/lib/hooks/use-want-to-go';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#F59E0B';

const STATUS_ICONS: Record<string, { icon: typeof Star; color: string }> = {
  dreaming: { icon: Star, color: '#F59E0B' },
  planned: { icon: MapPin, color: '#3B82F6' },
  visited: { icon: CheckCircle, color: '#10B981' },
};

export function WantToGoWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;

  const { data: items } = useWantToGo();
  const dreaming = (items ?? []).filter((i) => i.status === 'dreaming');
  const planned = (items ?? []).filter((i) => i.status === 'planned');
  const visited = (items ?? []).filter((i) => i.status === 'visited');
  const display = [...dreaming, ...planned].slice(0, isWide ? 5 : 3);

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
        <Compass style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          Where do you dream of going?
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Add places to your wish list from the map
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
          <Compass style={{ width: 12, height: 12, color: hex }} />
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: c.accent,
              textTransform: 'uppercase',
            }}
          >
            Want to Go
          </Typography>
        </Box>

        {/* Summary counters */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {dreaming.length > 0 && (
            <Typography sx={{ fontSize: '10px', color: '#F59E0B', fontWeight: 600 }}>
              {dreaming.length} dreaming
            </Typography>
          )}
          {visited.length > 0 && (
            <Typography sx={{ fontSize: '10px', color: '#10B981', fontWeight: 600 }}>
              {visited.length} visited
            </Typography>
          )}
        </Box>
      </Box>

      {/* Places list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, pb: 1.5 }}>
        {display.map((item) => {
          const statusInfo = STATUS_ICONS[item.status] || STATUS_ICONS.dreaming;
          const Icon = statusInfo.icon;
          const placeName = item.locationName || item.locationCity || 'Unknown';

          return (
            <Box
              key={item.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                py: 0.75,
                px: 0.75,
                borderRadius: '8px',
                transition: 'background 0.2s',
                '&:hover': { bgcolor: alpha(hex, 0.06) },
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: alpha(statusInfo.color, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon style={{ width: 13, height: 13, color: statusInfo.color }} />
              </Box>

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
                  {placeName}
                </Typography>
                {item.locationCountry && (
                  <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
                    {item.locationCountry}
                  </Typography>
                )}
              </Box>

              {item.notes && (
                <Typography
                  sx={{
                    fontSize: '10px',
                    color: 'text.disabled',
                    fontStyle: 'italic',
                    maxWidth: 80,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.notes}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
