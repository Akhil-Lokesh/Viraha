'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Lock, Unlock, Clock, MapPin, Gift } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useTimeCapsules } from '@/lib/hooks/use-time-capsules';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#6366F1';

export function TimeCapsuleWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;
  const isTall = size.rows >= 4;

  const { data: capsules } = useTimeCapsules(true);
  const sealed = (capsules ?? []).filter((cap) => !cap.isOpened);
  const openable = (capsules ?? []).filter((cap) => cap.isOpenable);
  const opened = (capsules ?? []).filter((cap) => cap.isOpened && !cap.isOpenable);

  if (!capsules || capsules.length === 0) {
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
        <Lock style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          No time capsules
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Seal a memory when you leave a place
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
          <Lock style={{ width: 12, height: 12, color: hex }} />
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: c.accent,
              textTransform: 'uppercase',
            }}
          >
            Time Capsules
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {sealed.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <Lock style={{ width: 9, height: 9, color: hex, opacity: 0.6 }} />
              <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>{sealed.length}</Typography>
            </Box>
          )}
          {openable.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              <Gift style={{ width: 9, height: 9, color: '#10B981' }} />
              <Typography sx={{ fontSize: '10px', color: '#10B981', fontWeight: 600 }}>{openable.length} ready</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Capsule list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, pb: 1.5 }}>
        {/* Openable capsules first (highlighted) */}
        {openable.map((cap) => (
          <Box
            key={cap.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              py: 1,
              px: 1,
              my: 0.5,
              borderRadius: '10px',
              bgcolor: alpha('#10B981', 0.08),
              border: '1px solid',
              borderColor: alpha('#10B981', 0.2),
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: alpha('#10B981', 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              <Gift style={{ width: 15, height: 15, color: '#10B981' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>
                Ready to open!
              </Typography>
              {cap.locationName && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25 }}>
                  <MapPin style={{ width: 9, height: 9, opacity: 0.5 }} />
                  <Typography sx={{ fontSize: '10px', color: 'text.secondary' }}>{cap.locationName}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        ))}

        {/* Sealed capsules */}
        {sealed.filter((cap) => !cap.isOpenable).map((cap) => {
          const opensIn = formatDistanceToNow(new Date(cap.openAt));
          return (
            <Box
              key={cap.id}
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
                  bgcolor: c.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Lock style={{ width: 12, height: 12, color: hex }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {cap.locationName && (
                  <Typography sx={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cap.locationName}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Clock style={{ width: 9, height: 9, opacity: 0.4 }} />
                  <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
                    Opens in {opensIn}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
                {cap.type === 'letter_to_self' ? 'Letter' : 'Departure'}
              </Typography>
            </Box>
          );
        })}

        {/* Recent opened capsules */}
        {isTall && opened.slice(0, 3).map((cap) => (
          <Box
            key={cap.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              py: 0.75,
              px: 0.75,
              borderRadius: '8px',
              opacity: 0.7,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: alpha(hex, 0.06),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Unlock style={{ width: 12, height: 12, color: hex, opacity: 0.4 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '11px', color: 'text.secondary', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                {cap.content.slice(0, 60)}...
              </Typography>
              <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
                Opened {cap.openedAt ? format(new Date(cap.openedAt), 'MMM d') : ''}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
