'use client';

import { Box, type SxProps, type Theme } from '@mui/material';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { CIN, photoVignette } from '@/lib/design/cinema-tokens';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

function resolve(url: string): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

interface PhotoTileProps {
  src: string;
  alt: string;
  /** Apply the bottom vignette for caption legibility. */
  vignette?: boolean;
  rounded?: number;
  sx?: SxProps<Theme>;
  /** Overlay content (captions, labels) positioned over the photo. */
  children?: React.ReactNode;
  /**
   * What to render when the image is missing or fails to load:
   * 'pattern' (default) — striped placeholder with an icon, reads as "no photo";
   * 'gradient' — quiet accent-tinted dark wash for decorative surfaces (covers)
   * where a placeholder icon would read as breakage.
   */
  fallback?: 'pattern' | 'gradient';
}

/**
 * Full-bleed photo with vignette, dark-surface loading base, and a tasteful
 * fallback when the image is missing or fails to load (never a raw broken img).
 */
export function PhotoTile({
  src,
  alt,
  vignette = true,
  rounded = 14,
  sx,
  children,
  fallback = 'pattern',
}: PhotoTileProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolve(src);
  const showImg = !!resolved && !failed;

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${rounded}px`,
        bgcolor: CIN.surface2,
        ...sx,
      }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt={alt}
          onError={() => setFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : fallback === 'gradient' ? (
        <Box
          aria-label={alt}
          role="img"
          sx={{
            width: '100%',
            height: '100%',
            minHeight: 160,
            background: `linear-gradient(135deg, ${CIN.surface2} 0%, rgba(139,124,255,0.12) 55%, ${CIN.surface} 100%)`,
          }}
        />
      ) : (
        <Box
          aria-label={alt}
          role="img"
          sx={{
            width: '100%',
            height: '100%',
            minHeight: 160,
            display: 'grid',
            placeItems: 'center',
            color: CIN.textMuted,
            background: `repeating-linear-gradient(45deg, ${CIN.surface}, ${CIN.surface} 12px, ${CIN.surface2} 12px, ${CIN.surface2} 24px)`,
          }}
        >
          <ImageOff size={28} />
        </Box>
      )}
      {vignette && showImg && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: photoVignette,
            pointerEvents: 'none',
          }}
        />
      )}
      {children && <Box sx={{ position: 'absolute', inset: 0 }}>{children}</Box>}
    </Box>
  );
}
