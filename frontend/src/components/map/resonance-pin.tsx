'use client';

import { Box, Typography } from '@mui/material';
import { MapPin, BookOpen } from 'lucide-react';
import type { MapMarkerData } from '@/lib/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

/**
 * Get pin color based on resonance score (0-1).
 * Warm colors = high resonance, cool colors = low resonance.
 */
function getResonanceColor(score: number): { border: string; glow: string; bg: string } {
  if (score >= 0.7) return { border: '#F59E0B', glow: 'rgba(245,158,11,0.3)', bg: '#F59E0B' };
  if (score >= 0.5) return { border: '#F97316', glow: 'rgba(249,115,22,0.25)', bg: '#F97316' };
  if (score >= 0.3) return { border: '#EC4899', glow: 'rgba(236,72,153,0.2)', bg: '#EC4899' };
  if (score >= 0.15) return { border: '#8B5CF6', glow: 'rgba(139,92,246,0.15)', bg: '#8B5CF6' };
  return { border: '#6B7280', glow: 'rgba(107,114,128,0.1)', bg: '#6B7280' };
}

interface ResonancePinProps {
  marker: MapMarkerData;
  resonance?: number;
}

export function ResonancePin({ marker, resonance = 0 }: ResonancePinProps) {
  const resolved = marker.thumbnail ? resolveImageUrl(marker.thumbnail) : null;
  const isJournal = marker.type === 'journal';
  const colors = getResonanceColor(resonance);
  const size = 36 + resonance * 12; // 36-48px

  return (
    <Box sx={{ position: 'relative', '&:hover .pin-img': { transform: 'scale(1.1)' } }}>
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
            bgcolor: colors.glow,
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
          border: 2.5,
          borderColor: colors.border,
          boxShadow: `0 0 ${resonance * 12}px ${colors.glow}`,
          overflow: 'hidden',
          transition: 'transform 0.2s',
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
              bgcolor: colors.bg,
            }}
          >
            {isJournal ? (
              <BookOpen style={{ height: 16, width: 16, color: 'white' }} />
            ) : (
              <MapPin style={{ height: 16, width: 16, color: 'white' }} />
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
          boxShadow: 1,
          bgcolor: colors.border,
        }}
      />
    </Box>
  );
}
