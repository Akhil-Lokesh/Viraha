'use client';

import { Box, Typography, useTheme, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Clock, BookOpen } from 'lucide-react';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { useOnThisDay } from '@/lib/hooks/use-viraha';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#7B68EE';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

// Fallback photos when no memories exist
const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80';

export function OnThisDayWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isWide = size.cols >= 4;
  const isTall = size.rows >= 4;

  const { data: items, isLoading } = useOnThisDay();

  if (isLoading) {
    return (
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', height: '100%', bgcolor: c.bgTint }}>
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  const memories = items ?? [];
  const primary = memories[0];
  const secondary = memories[1];

  // No memories for today — show gentle empty state
  if (!primary) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          position: 'relative',
          bgcolor: c.bgTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1,
          p: 2,
        }}
      >
        <Clock style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          No memories on this day yet
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          Keep traveling — future you will love looking back
        </Typography>
      </Box>
    );
  }

  const primaryImage = primary.thumbnail ? resolveImageUrl(primary.thumbnail) : FALLBACK_PHOTO;
  const secondaryImage = secondary?.thumbnail ? resolveImageUrl(secondary.thumbnail) : null;
  const primaryHref = primary.type === 'journal_entry' ? `/journals/${primary.journalId}` : `/post/${primary.id}`;
  const location = primary.locationCity
    ? `${primary.locationCity}${primary.locationCountry ? ', ' + primary.locationCountry : ''}`
    : primary.locationName || '';
  const yearsLabel = `${primary.yearsAgo} ${primary.yearsAgo === 1 ? 'Year' : 'Years'} Ago`;

  // 4×2 or 4×4 — cinematic split layout
  if (isWide && secondaryImage) {
    const secondaryHref = secondary!.type === 'journal_entry' ? `/journals/${secondary!.journalId}` : `/post/${secondary!.id}`;
    return (
      <Link href={primaryHref} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        <Box
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            position: 'relative',
          }}
        >
          <Box sx={{ flex: '0 0 55%', position: 'relative' }}>
            <Image src={primaryImage} alt={primary.title} fill style={{ objectFit: 'cover' }} unoptimized />
            <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${alpha(hex, 0.6)} 0%, transparent 60%)` }} />
            <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Clock style={{ width: 12, height: 12, color: alpha('#fff', 0.8) }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: alpha('#fff', 0.8), textTransform: 'uppercase' }}>
                  On This Day
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, color: 'white', fontSize: isTall ? '1.75rem' : '1.35rem', lineHeight: 1.2 }}>
                {yearsLabel}
              </Typography>
            </Box>
            {primary.type === 'journal_entry' && (
              <Box sx={{ position: 'absolute', top: 20, right: 12, bgcolor: 'rgba(139,92,246,0.9)', color: 'white', fontSize: '10px', fontWeight: 500, px: 0.75, py: 0.25, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 0.5, zIndex: 2 }}>
                <BookOpen style={{ height: 10, width: 10 }} />
                Journal
              </Box>
            )}
          </Box>

          <Box sx={{ flex: 1, position: 'relative' }}>
            <Image src={secondaryImage} alt={secondary!.title} fill style={{ objectFit: 'cover' }} unoptimized />
            <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${alpha(hex, 0.7)} 0%, transparent 50%)` }} />
            <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 2 }}>
              {location && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5, borderRadius: '20px', bgcolor: alpha('#000', 0.35), backdropFilter: 'blur(8px)' }}>
                  <MapPin style={{ width: 12, height: 12, color: 'white' }} />
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>
                    {location}
                  </Typography>
                </Box>
              )}
              {isTall && (
                <Typography sx={{ fontSize: '13px', color: alpha('#fff', 0.85), mt: 1.5, lineHeight: 1.5, fontStyle: 'italic' }}>
                  &ldquo;{primary.title}&rdquo;
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: '55%', width: 3, bgcolor: c.accent, zIndex: 3 }} />
        </Box>
      </Link>
    );
  }

  // 2×2 or 2×4 — full-bleed single photo
  return (
    <Link href={primaryHref} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', height: '100%', position: 'relative' }}>
        <Image src={primaryImage} alt={primary.title} fill style={{ objectFit: 'cover' }} unoptimized />
        <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${alpha(hex, 0.85)} 15%, ${alpha(hex, 0.4)} 50%, transparent 100%)` }} />

        <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Clock style={{ width: 11, height: 11, color: alpha('#fff', 0.7) }} />
            <Typography sx={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: alpha('#fff', 0.7), textTransform: 'uppercase' }}>
              On This Day
            </Typography>
          </Box>
        </Box>

        {primary.type === 'journal_entry' && (
          <Box sx={{ position: 'absolute', top: 16, right: 12, bgcolor: 'rgba(139,92,246,0.9)', color: 'white', fontSize: '10px', fontWeight: 500, px: 0.75, py: 0.25, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 0.5, zIndex: 2 }}>
            <BookOpen style={{ height: 10, width: 10 }} />
          </Box>
        )}

        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, zIndex: 2 }}>
          <Typography sx={{ fontWeight: 800, color: 'white', fontSize: '1.25rem', lineHeight: 1.2 }}>
            {yearsLabel}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, mt: 1.5 }}>
            {secondaryImage && (
              <Box sx={{ width: 56, height: 56, borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0, border: `2px solid ${alpha('#fff', 0.3)}` }}>
                <Image src={secondaryImage} alt={secondary!.title} fill style={{ objectFit: 'cover' }} unoptimized />
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {isTall && (
                <Typography sx={{ fontSize: '12px', color: alpha('#fff', 0.8), fontStyle: 'italic', lineHeight: 1.4, mb: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  &ldquo;{primary.title}&rdquo;
                </Typography>
              )}
              {location && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: '12px', bgcolor: alpha('#000', 0.3), backdropFilter: 'blur(6px)' }}>
                  <MapPin style={{ width: 10, height: 10, color: 'white' }} />
                  <Typography sx={{ fontSize: '11px', fontWeight: 600, color: alpha('#fff', 0.9) }}>
                    {location}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {memories.length > 2 && (
            <Typography sx={{ fontSize: '10px', color: alpha('#fff', 0.6), mt: 1, textAlign: 'right' }}>
              +{memories.length - 2} more {memories.length - 2 === 1 ? 'memory' : 'memories'}
            </Typography>
          )}
        </Box>
      </Box>
    </Link>
  );
}
