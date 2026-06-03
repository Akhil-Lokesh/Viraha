'use client';

import { Box, Typography, useTheme, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Images } from 'lucide-react';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { pickDisplayAlbum, resolveAlbumCover } from '@/lib/dashboard/mock-albums';
import { useAlbums } from '@/lib/hooks/use-albums';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#7B68EE';

export function AlbumPreviewWidget({ size, color, albumId }: { size: WidgetGridSize; color?: string; albumId?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isFull = size.cols >= 4 && size.rows >= 4;
  const isWide = size.cols >= 4 && size.rows < 4;

  const { data, isLoading, isError } = useAlbums();
  const albums = data?.pages.flatMap((p) => p.items) ?? [];
  const album = pickDisplayAlbum(albums, albumId);

  if (isLoading) {
    return (
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', height: '100%', bgcolor: c.bgTint }}>
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  if (isError) {
    return (
      <EmptyAlbumPreview
        bgTint={c.bgTint}
        hex={hex}
        title="Couldn't load albums"
        subtitle="Please try again in a moment"
      />
    );
  }

  if (!album) {
    return (
      <EmptyAlbumPreview
        bgTint={c.bgTint}
        hex={hex}
        title="No albums yet"
        subtitle="Create your first trip to feature it here"
        href="/albums"
      />
    );
  }

  const coverUrl = resolveAlbumCover(album.coverImage);

  return (
    <Link href={`/albums/${album.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
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
        <Box sx={{ position: 'relative', flex: 1, minHeight: 100, bgcolor: c.bgTint }}>
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={album.title}
              fill
              style={{ objectFit: 'cover', transition: 'transform 0.5s' }}
              unoptimized
            />
          ) : (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Images style={{ width: 40, height: 40, color: alpha(hex, 0.4) }} />
            </Box>
          )}

          {/* Heart button */}
          <Box
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
                {album.postCount} {album.postCount === 1 ? 'Photo' : 'Photos'}
              </Typography>
              {isFull && (
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.9)', mt: 1, fontWeight: 600 }}
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
              {album.postCount} {album.postCount === 1 ? 'Photo' : 'Photos'}
            </Typography>
          </Box>
        )}
      </Box>
    </Link>
  );
}

function EmptyAlbumPreview({
  bgTint,
  hex,
  title,
  subtitle,
  href,
}: {
  bgTint: string;
  hex: string;
  title: string;
  subtitle: string;
  href?: string;
}) {
  const inner = (
    <Box
      sx={{
        bgcolor: bgTint,
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
        {title}
      </Typography>
      <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
        {subtitle}
      </Typography>
    </Box>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
