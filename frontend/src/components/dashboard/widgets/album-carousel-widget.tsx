'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { MOCK_ALBUMS, getAlbumById } from '@/lib/dashboard/mock-albums';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#059669';

export function AlbumCarouselWidget({ size, color, albumId }: { size: WidgetGridSize; color?: string; albumId?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isTall = size.rows >= 2;
  const coverSize = isTall ? 180 : 110;

  // Put the selected album first, then the rest
  const selected = getAlbumById(albumId);
  const ordered = [selected, ...MOCK_ALBUMS.filter((a) => a.id !== selected.id)];

  return (
    <Box
      sx={{
        bgcolor: c.bgTint,
        borderRadius: '16px',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          height: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: isTall ? 2 : 1,
          scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {ordered.map((album) => (
          <Box
            key={album.id}
            sx={{
              flexShrink: 0,
              scrollSnapAlign: 'start',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: isTall ? 'column' : 'row',
              alignItems: isTall ? 'stretch' : 'center',
              gap: isTall ? 1 : 1.5,
              '&:hover .album-title': { color: c.accent },
            }}
          >
            <Box
              sx={{
                width: coverSize,
                height: coverSize,
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: album.id === selected.id ? `0 0 0 3px ${c.accent}` : 1,
                flexShrink: 0,
              }}
            >
              <Image src={album.cover} alt={album.title} fill style={{ objectFit: 'cover' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                className="album-title"
                sx={{
                  fontWeight: album.id === selected.id ? 700 : 600,
                  fontSize: isTall ? '14px' : '13px',
                  color: album.id === selected.id ? c.accent : 'text.primary',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {album.title}
              </Typography>
              {isTall && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {album.photos} photos &bull; {album.location}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Edge fade gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 40,
          background: (t) =>
            `linear-gradient(to left, ${t.palette.mode === 'dark' ? alpha(hex, 0.15) : alpha(hex, 0.06)}, transparent)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </Box>
  );
}
