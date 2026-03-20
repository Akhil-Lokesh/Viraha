'use client';

import { Box, useTheme } from '@mui/material';
import Image from 'next/image';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import { getAlbumById, MOCK_ALBUMS } from '@/lib/dashboard/mock-albums';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#475569';

/** Build a set of photo URLs for the mosaic — start from the selected album, fill with others */
function getPhotosForAlbum(albumId?: string): string[] {
  const selected = getAlbumById(albumId);
  const others = MOCK_ALBUMS.filter((a) => a.id !== selected.id);
  return [selected.cover, ...others.map((a) => a.cover)].slice(0, 9);
}

function PhotoCell({ src, alt, accent }: { src: string; alt: string; accent: string }) {
  return (
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
      <Image src={src} alt={alt} fill style={{ objectFit: 'cover', transition: 'transform 0.4s' }} />
    </Box>
  );
}

export function PhotoMosaicWidget({ size, color, albumId }: { size: WidgetGridSize; color?: string; albumId?: string }) {
  const theme = useTheme();
  const c = getWidgetColorStyles(color ?? DEFAULT_COLOR, theme.palette.mode);
  const isMedium = size.cols >= 4 && size.rows < 4;
  const isFull = size.cols >= 4 && size.rows >= 4;
  const photos = getPhotosForAlbum(albumId);

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
          <PhotoCell src={photos[0]} alt="Photo 1" accent={c.accent} />
        </Box>
        {photos.slice(1, 6).map((src, i) => (
          <PhotoCell key={i} src={src} alt={`Photo ${i + 2}`} accent={c.accent} />
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
          <PhotoCell src={photos[0]} alt="Photo 1" accent={c.accent} />
        </Box>
        <PhotoCell src={photos[1]} alt="Photo 2" accent={c.accent} />
        <PhotoCell src={photos[2]} alt="Photo 3" accent={c.accent} />
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
      }}
    >
      {photos.slice(0, 4).map((src, i) => (
        <PhotoCell key={i} src={src} alt={`Photo ${i + 1}`} accent={c.accent} />
      ))}
    </Box>
  );
}
