'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface PhotoCarouselProps {
  photos: string[];
  aspectRatio?: 'video' | 'square' | 'hero';
  sx?: SxProps<Theme>;
  showControls?: boolean;
}

const aspectStyles: Record<string, SxProps<Theme>> = {
  video: { aspectRatio: '16/9' },
  square: { aspectRatio: '1/1' },
  hero: { height: '70vh', minHeight: 500 },
};

export function PhotoCarousel({
  photos,
  aspectRatio = 'video',
  sx: sxProp,
  showControls = true,
}: PhotoCarouselProps) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? photos.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === photos.length - 1 ? 0 : c + 1));

  if (photos.length === 0) return null;

  return (
    <Box
      sx={[
        {
          position: 'relative',
          overflow: 'hidden',
        },
        aspectStyles[aspectRatio] as any,
        ...(Array.isArray(sxProp) ? sxProp : sxProp ? [sxProp] : []),
      ]}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={photos[current]}
          alt={`Photo ${current + 1}`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </AnimatePresence>

      {showControls && photos.length > 1 && (
        <>
          <Box
            component="button"
            onClick={prev}
            aria-label="Previous photo"
            sx={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              opacity: 0,
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '.MuiBox-root:hover > &, &:hover, &:focus': {
                opacity: 1,
              },
            }}
          >
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </Box>
          <Box
            component="button"
            onClick={next}
            aria-label="Next photo"
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              opacity: 0,
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '.MuiBox-root:hover > &, &:hover, &:focus': {
                opacity: 1,
              },
            }}
          >
            <ChevronRight style={{ width: 20, height: 20 }} />
          </Box>
        </>
      )}

      {photos.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 0.75,
          }}
        >
          {photos.map((_, i) => (
            <Box
              component="button"
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to photo ${i + 1}`}
              sx={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: '9999px',
                transition: 'all 0.2s',
                bgcolor: i === current ? '#fff' : 'rgba(255,255,255,0.5)',
                border: 'none',
                cursor: 'pointer',
                p: 0,
                '&:hover': {
                  bgcolor: i === current ? '#fff' : 'rgba(255,255,255,0.7)',
                },
              }}
            />
          ))}
        </Box>
      )}

      {photos.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            bgcolor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            fontSize: '0.75rem',
            px: 1.25,
            py: 0.5,
            borderRadius: '9999px',
          }}
        >
          {current + 1}/{photos.length}
        </Box>
      )}
    </Box>
  );
}
