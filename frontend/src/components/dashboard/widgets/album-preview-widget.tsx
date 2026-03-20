'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { getAlbumById } from '@/lib/dashboard/mock-albums';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#7B68EE';

export function AlbumPreviewWidget({ size, color, albumId }: { size: WidgetGridSize; color?: string; albumId?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isFull = size.cols >= 4 && size.rows >= 4;
  const isWide = size.cols >= 4 && size.rows < 4;
  const album = getAlbumById(albumId);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 1,
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover img': { transform: 'scale(1.05)' },
      }}
    >
      <Box sx={{ position: 'relative', flex: 1, minHeight: 100 }}>
        <Image
          src={album.cover.replace('w=400', 'w=800')}
          alt={album.title}
          fill
          style={{ objectFit: 'cover', transition: 'transform 0.5s' }}
        />

        {/* Heart button */}
        <Box
          component="button"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            bgcolor: c.accent,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
            zIndex: 10,
            border: 'none',
            cursor: 'pointer',
            '&:hover': { opacity: 0.9 },
            transition: 'opacity 0.2s',
          }}
        >
          <Heart style={{ width: 16, height: 16, color: 'white' }} />
        </Box>

        {/* Gradient overlay for wide/full */}
        {(isFull || isWide) && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 3,
              background: `linear-gradient(to top, ${alpha(hex, 0.5)}, transparent)`,
            }}
          >
            <Typography sx={{ fontWeight: 700, color: 'white', fontSize: isFull ? '1.75rem' : '1.5rem' }}>
              {album.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {album.photos} Photos &bull; {album.location}
            </Typography>
            {isFull && (
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.9)', mt: 1, fontWeight: 600, cursor: 'pointer' }}
              >
                View Album &rarr;
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Bottom strip for 2x2 */}
      {!isFull && !isWide && (
        <Box sx={{ p: 2, flexShrink: 0 }}>
          <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{album.title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {album.photos} Photos &bull; {album.location}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
