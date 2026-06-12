'use client';

import { Box } from '@mui/material';
import { MapPin, BookOpen } from 'lucide-react';
import { CIN } from '@/lib/design/cinema-tokens';
import type { MapMarkerData } from '@/lib/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

interface ResonanceStyle {
  border: string;
  glow: string;
  bg: string;
  /** Glow halo size in px — scales with resonance. */
  ring: number;
}

/**
 * Resonance maps to accent-violet intensity: high-resonance places burn
 * bright violet with a wide glow halo; low-resonance places fade toward the
 * dark surface. One hue, varying light — photos stay the color source.
 */
function getResonanceStyle(score: number): ResonanceStyle {
  if (score >= 0.7) {
    return { border: CIN.accent, glow: 'rgba(139,124,255,0.55)', bg: CIN.accent, ring: 20 };
  }
  if (score >= 0.5) {
    return { border: CIN.accent, glow: 'rgba(139,124,255,0.4)', bg: '#7A6CE0', ring: 15 };
  }
  if (score >= 0.3) {
    return { border: '#7A6CE0', glow: 'rgba(139,124,255,0.28)', bg: '#665AB8', ring: 10 };
  }
  if (score >= 0.15) {
    return { border: '#5B5295', glow: 'rgba(139,124,255,0.18)', bg: '#474073', ring: 6 };
  }
  return { border: '#3E3E4C', glow: 'rgba(139,124,255,0.1)', bg: CIN.surface2, ring: 0 };
}

interface ResonancePinProps {
  marker: MapMarkerData;
  resonance?: number;
}

export function ResonancePin({ marker, resonance = 0 }: ResonancePinProps) {
  const resolved = marker.thumbnail ? resolveImageUrl(marker.thumbnail) : null;
  const isJournal = marker.type === 'journal';
  const style = getResonanceStyle(resonance);
  const size = 36 + resonance * 12; // 36-48px

  return (
    <Box
      sx={{
        position: 'relative',
        '&:hover .pin-img': {
          transform: 'scale(1.08)',
          boxShadow: `0 0 0 1px ${CIN.accent}, 0 0 ${Math.max(style.ring, 14)}px ${CIN.accentGlow}`,
        },
      }}
    >
      {/* Glow pulse — only for high-resonance places */}
      {resonance >= 0.3 && (
        <Box
          sx={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            animation: resonance >= 0.6
              ? 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite'
              : 'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite',
            pointerEvents: 'none',
            bgcolor: style.glow,
          }}
        />
      )}
      <Box
        className="pin-img"
        sx={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2.5px solid ${style.border}`,
          boxShadow: `0 0 ${style.ring}px ${style.glow}`,
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          bgcolor: CIN.surface2,
        }}
      >
        {resolved ? (
          <img
            src={resolved}
            alt={marker.title || marker.locationName || 'Location'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: style.bg,
              color: CIN.text,
            }}
          >
            {isJournal ? (
              <BookOpen style={{ height: 16, width: 16 }} />
            ) : (
              <MapPin style={{ height: 16, width: 16 }} />
            )}
          </Box>
        )}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: -4,
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 8,
          height: 8,
          bgcolor: style.border,
        }}
      />
    </Box>
  );
}
