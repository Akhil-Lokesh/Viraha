'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Fingerprint, Globe, MapPin, Camera, BookOpen } from 'lucide-react';
import { AnimatedCounter } from '../animated-counter';
import { useAtlas } from '@/lib/hooks/use-atlas';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#7C3AED';

export function TravelStyleWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;
  const isCompact = size.cols <= 2 && size.rows <= 1;

  const { data: atlas, isLoading } = useAtlas();

  if (isLoading) {
    return (
      <Box sx={{ bgcolor: c.bgTint, borderRadius: '16px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Fingerprint style={{ width: 24, height: 24, color: hex, opacity: 0.15, animation: 'pulse 2s ease-in-out infinite' }} />
      </Box>
    );
  }

  if (!atlas || atlas.stats.totalPosts === 0) {
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
        <Fingerprint style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          Your travel DNA
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Post from your travels to discover your style
        </Typography>
      </Box>
    );
  }

  const { stats, travelStyle } = atlas;

  // 1×1 or 2×1 compact — badge only
  if (isCompact) {
    return (
      <Box
        sx={{
          bgcolor: c.bgTint,
          borderRadius: '16px',
          p: 2,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: c.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Fingerprint style={{ width: 18, height: 18, color: c.accent }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: c.accent, lineHeight: 1.2 }}>
            {travelStyle}
          </Typography>
          <Typography sx={{ fontSize: '10px', color: 'text.disabled' }}>
            Travel Style
          </Typography>
        </Box>
      </Box>
    );
  }

  // 2×2+ — full card
  return (
    <Box
      sx={{
        bgcolor: c.bgTint,
        borderRadius: '16px',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Decorative background pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          bgcolor: alpha(hex, 0.06),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: alpha(hex, 0.04),
        }}
      />

      {/* Header */}
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5, zIndex: 1, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Fingerprint style={{ width: 12, height: 12, color: hex }} />
          <Typography
            sx={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: c.accent,
              textTransform: 'uppercase',
            }}
          >
            Travel DNA
          </Typography>
        </Box>
      </Box>

      {/* Style badge */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, px: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: c.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1,
              boxShadow: `0 0 20px ${alpha(hex, 0.2)}`,
            }}
          >
            <Fingerprint style={{ width: 28, height: 28, color: hex }} />
          </Box>
          <Typography sx={{ fontSize: isWide ? '1.3rem' : '1.1rem', fontWeight: 800, lineHeight: 1.2 }}>
            {travelStyle}
          </Typography>
        </Box>
      </Box>

      {/* Stats row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          px: 1.5,
          pb: 1.5,
          pt: 0.5,
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        {[
          { value: stats.totalCountries, icon: Globe, label: 'Countries' },
          { value: stats.totalCities, icon: MapPin, label: 'Cities' },
          { value: stats.totalContinents, icon: Camera, label: 'Continents' },
        ].map(({ value, icon: Icon, label }) => (
          <Box key={label} sx={{ textAlign: 'center' }}>
            <AnimatedCounter
              value={value}
              sx={{ fontSize: '1.1rem', fontWeight: 800, color: c.accent, lineHeight: 1 }}
            />
            <Typography sx={{ fontSize: '9px', color: 'text.disabled', mt: 0.25 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
