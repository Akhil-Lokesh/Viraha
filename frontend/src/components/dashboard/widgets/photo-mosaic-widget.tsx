'use client';

import { Box, Typography, useTheme, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { Images } from 'lucide-react';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { getAlbumCovers } from '@/lib/dashboard/mock-albums';
import { useAlbums } from '@/lib/hooks/use-albums';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#475569';

interface MosaicCover {
  id: string;
  url: string;
  title: string;
}

function PhotoCell({ cover, accent }: { cover: MosaicCover; accent: string }) {
  return (
    <Link href={`/albums/${cover.id}`} style={{ display: 'block', width: '100%', height: '100%', textDecoration: 'none' }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '8px',
          cursor: 'pointer',
          '&:hover img': { transform: 'scale(1.08)' },
          '&:hover': { boxShadow: `0 0 0 2px ${accent}` },
          transition: 'box-shadow 0.2s',
        }}
      >
        <Image src={cover.url} alt={cover.title} fill style={{ objectFit: 'cover', transition: 'transform 0.4s' }} unoptimized />
      </Box>
    </Link>
  );
}

export function PhotoMosaicWidget({ size, color, albumId }: { size: WidgetGridSize; color?: string; albumId?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);
  const isMedium = size.cols >= 4 && size.rows < 4;
  const isFull = size.cols >= 4 && size.rows >= 4;

  const { data, isLoading, isError } = useAlbums();
  const albums = data?.pages.flatMap((p) => p.items) ?? [];
  const covers = getAlbumCovers(albums, albumId).slice(0, 9);

  if (isLoading) {
    return (
      <Box sx={{ borderRadius: '16px', overflow: 'hidden', height: '100%', bgcolor: c.bgTint }}>
        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '16px' }} />
      </Box>
    );
  }

  if (isError || covers.length === 0) {
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
          {isError ? "Couldn't load photos" : 'No photos yet'}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: 'text.disabled', textAlign: 'center' }}>
          {isError ? 'Please try again in a moment' : 'Add photos to an album to build your mosaic'}
        </Typography>
      </Box>
    );
  }

  // Fill remaining cells by repeating covers so the grid never has holes.
  const cell = (index: number): MosaicCover => covers[index % covers.length];

  if (isFull) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '4px',
        }}
      >
        <Box sx={{ gridColumn: '1 / 3', gridRow: '1 / 3' }}>
          <PhotoCell cover={cell(0)} accent={c.accent} />
        </Box>
        {[1, 2, 3, 4, 5].map((i) => (
          <PhotoCell key={i} cover={cell(i)} accent={c.accent} />
        ))}
      </Box>
    );
  }

  if (isMedium) {
    return (
      <Box
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '4px',
        }}
      >
        <Box sx={{ gridColumn: '1 / 3', gridRow: '1 / 3' }}>
          <PhotoCell cover={cell(0)} accent={c.accent} />
        </Box>
        <PhotoCell cover={cell(1)} accent={c.accent} />
        <PhotoCell cover={cell(2)} accent={c.accent} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        height: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: '4px',
        bgcolor: alpha(hex, 0.04),
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <PhotoCell key={i} cover={cell(i)} accent={c.accent} />
      ))}
    </Box>
  );
}
