'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { Images } from 'lucide-react';
import type { Album } from '@/lib/types';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';
import { AlbumCard } from './album-card';

const GOLD = 'var(--viraha-gold, #D4A843)';

/** Empty shelf — an outline photo stack with a stamp, per the keepsake motifs. */
function EmptyShelf() {
  return (
    <Box
      component={motion.div}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        py: 10,
      }}
    >
      {/* Stacked empty photo frames */}
      <Box sx={{ position: 'relative', width: 120, height: 96, mb: 4 }}>
        {[{ r: -4, o: 0.35, t: 10 }, { r: 3, o: 0.55, t: 5 }, { r: -1, o: 1, t: 0 }].map(
          ({ r, o, t }, i) => (
            <Box
              key={i}
              sx={(theme) => ({
                position: 'absolute',
                inset: 0,
                top: t,
                transform: `rotate(${r}deg)`,
                borderRadius: '4px',
                border: '1.5px dashed',
                borderColor:
                  theme.palette.mode === 'dark'
                    ? `rgba(242,234,217,${0.3 * o})`
                    : `rgba(34,28,24,${0.3 * o})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              {i === 2 && <Images style={{ width: 28, height: 28, color: GOLD }} />}
            </Box>
          ),
        )}
        {/* corner stamp */}
        <Box
          sx={{
            position: 'absolute',
            top: -14,
            right: -22,
            transform: 'rotate(8deg)',
            border: `1.5px solid ${GOLD}`,
            color: GOLD,
            borderRadius: '4px',
            px: 0.75,
            py: 0.25,
            fontFamily: 'var(--font-brand)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Empty
        </Box>
      </Box>

      <Typography
        sx={(theme) => ({
          fontFamily: 'var(--font-accent)',
          fontSize: '1.5rem',
          color:
            theme.palette.mode === 'dark'
              ? 'var(--viraha-ink-dark, #F2EAD9)'
              : 'var(--viraha-ink, #221C18)',
          mb: 1,
        })}
      >
        No albums on the shelf yet
      </Typography>
      <Typography sx={{ color: 'text.secondary', maxWidth: 384, mb: 3 }}>
        Create an album to organize your travel memories into collections.
      </Typography>
      <Button
        variant="outlined"
        disableElevation
        component={Link}
        href="/create/album"
        sx={{
          borderRadius: '4px',
          borderColor: GOLD,
          color: 'text.primary',
          fontWeight: 600,
          px: 3,
          '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,168,67,0.08)' },
        }}
      >
        Create your first album
      </Button>
    </Box>
  );
}

export function AlbumGrid({ albums }: { albums: Album[] }) {
  if (albums.length === 0) {
    return <EmptyShelf />;
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          columnGap: 3,
          rowGap: 4.5,
        }}
      >
        {albums.map((album) => (
          <motion.div key={album.id} variants={staggerItem}>
            <AlbumCard album={album} />
          </motion.div>
        ))}
      </Box>
    </motion.div>
  );
}
