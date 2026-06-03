'use client';

import { Box, Typography, useTheme, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { Images } from 'lucide-react';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { pickDisplayAlbum, resolveAlbumCover } from '@/lib/dashboard/mock-albums';
import { useAlbums } from '@/lib/hooks/use-albums';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#059669';

export function AlbumCarouselWidget({ size, color, albumId }: { size: WidgetGridSize; color?: string; albumId?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isTall = size.rows >= 2;
  const coverSize = isTall ? 180 : 110;

  const { data, isLoading, isError } = useAlbums();
  const albums = data?.pages.flatMap((p) => p.items) ?? [];

  // Put the selected album first, then the rest.
  const selected = pickDisplayAlbum(albums, albumId);
  const ordered = selected ? [selected, ...albums.filter((a) => a.id !== selected.id)] : [];

  if (isLoading) {
    return (
      <Box sx={{ bgcolor: c.bgTint, borderRadius: '16px', height: '100%', overflow: 'hidden' }}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
    );
  }

  if (isError || ordered.length === 0) {
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
        <Images style={{ width: 24, height: 24, color: hex, opacity: 0.6 }} />
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
          {isError ? "Couldn't load albums" : 'No albums yet'}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          {isError ? 'Please try again in a moment' : 'Create your first trip to see it here'}
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
        {ordered.map((album) => {
          const cover = resolveAlbumCover(album.coverImage);
          return (
            <Link
              key={album.id}
              href={`/albums/${album.id}`}
              style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
            >
              <Box
                sx={{
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
                    bgcolor: alpha(hex, 0.1),
                    boxShadow: album.id === selected?.id ? `0 0 0 3px ${c.accent}` : 1,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cover ? (
                    <Image src={cover} alt={album.title} fill style={{ objectFit: 'cover' }} unoptimized />
                  ) : (
                    <Images style={{ width: 28, height: 28, color: alpha(hex, 0.5) }} />
                  )}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    className="album-title"
                    sx={{
                      fontWeight: album.id === selected?.id ? 700 : 600,
                      fontSize: isTall ? '14px' : '13px',
                      color: album.id === selected?.id ? c.accent : 'text.primary',
                      transition: 'color 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {album.title}
                  </Typography>
                  {isTall && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {album.postCount} {album.postCount === 1 ? 'photo' : 'photos'}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Link>
          );
        })}
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
