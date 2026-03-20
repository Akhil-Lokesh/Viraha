'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import { MapPin, Clock } from 'lucide-react';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#7B68EE';

const PHOTO_1 = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80';
const PHOTO_2 = 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80';

export function OnThisDayWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;
  const isTall = size.rows >= 4;

  // 4×2 or 4×4 — cinematic split layout
  if (isWide) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          position: 'relative',
        }}
      >
        {/* Left: hero photo with gradient */}
        <Box sx={{ flex: '0 0 55%', position: 'relative' }}>
          <Image src={PHOTO_1} alt="Paris" fill style={{ objectFit: 'cover' }} />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${alpha(hex, 0.6)} 0%, transparent 60%)`,
            }}
          />
          {/* Label floating on photo */}
          <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <Clock style={{ width: 12, height: 12, color: alpha('#fff', 0.8) }} />
              <Typography
                sx={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  color: alpha('#fff', 0.8),
                  textTransform: 'uppercase',
                }}
              >
                On This Day
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, color: 'white', fontSize: isTall ? '1.75rem' : '1.35rem', lineHeight: 1.2 }}>
              2 Years Ago
            </Typography>
          </Box>
        </Box>

        {/* Right: second photo + info overlay */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <Image src={PHOTO_2} alt="Paris" fill style={{ objectFit: 'cover' }} />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to top, ${alpha(hex, 0.7)} 0%, transparent 50%)`,
            }}
          />
          <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 2 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.25,
                py: 0.5,
                borderRadius: '20px',
                bgcolor: alpha('#000', 0.35),
                backdropFilter: 'blur(8px)',
              }}
            >
              <MapPin style={{ width: 12, height: 12, color: 'white' }} />
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>
                Paris, France
              </Typography>
            </Box>
            {isTall && (
              <Typography
                sx={{
                  fontSize: '13px',
                  color: alpha('#fff', 0.85),
                  mt: 1.5,
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}
              >
                &ldquo;Walking along the Seine at golden hour, watching the city glow...&rdquo;
              </Typography>
            )}
          </Box>
        </Box>

        {/* Accent divider line between photos */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '55%',
            width: 3,
            bgcolor: c.accent,
            zIndex: 3,
          }}
        />
      </Box>
    );
  }

  // 2×2 or 2×4 — full-bleed single photo, content overlay
  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Full-bleed background photo */}
      <Image src={PHOTO_1} alt="Paris" fill style={{ objectFit: 'cover' }} />

      {/* Gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to top, ${alpha(hex, 0.85)} 15%, ${alpha(hex, 0.4)} 50%, transparent 100%)`,
        }}
      />

      {/* Top label */}
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Clock style={{ width: 11, height: 11, color: alpha('#fff', 0.7) }} />
          <Typography
            sx={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: alpha('#fff', 0.7),
              textTransform: 'uppercase',
            }}
          >
            On This Day
          </Typography>
        </Box>
      </Box>

      {/* Bottom content */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          zIndex: 2,
        }}
      >
        <Typography sx={{ fontWeight: 800, color: 'white', fontSize: '1.25rem', lineHeight: 1.2 }}>
          2 Years Ago
        </Typography>

        {/* Thumbnail of second photo */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, mt: 1.5 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'relative',
              flexShrink: 0,
              border: `2px solid ${alpha('#fff', 0.3)}`,
            }}
          >
            <Image src={PHOTO_2} alt="Paris" fill style={{ objectFit: 'cover' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {isTall && (
              <Typography
                sx={{
                  fontSize: '12px',
                  color: alpha('#fff', 0.8),
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                  mb: 1,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                &ldquo;Walking along the Seine at golden hour, watching the city glow...&rdquo;
              </Typography>
            )}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: '12px',
                bgcolor: alpha('#000', 0.3),
                backdropFilter: 'blur(6px)',
              }}
            >
              <MapPin style={{ width: 10, height: 10, color: 'white' }} />
              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: alpha('#fff', 0.9) }}>
                Paris
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
