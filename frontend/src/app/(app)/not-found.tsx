'use client';

import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 3,
      }}
    >
      {/* Compass stamp on a dashed flight path */}
      <Box sx={{ position: 'relative', width: 160, height: 120 }}>
        <Box
          component="svg"
          viewBox="0 0 160 120"
          aria-hidden
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <path
            d="M 4 104 C 44 108, 64 48, 100 44 S 146 24, 156 8"
            fill="none"
            stroke="var(--viraha-gold, #D4A843)"
            strokeWidth="1.25"
            strokeDasharray="6 8"
          />
          <circle cx="156" cy="8" r="3" fill="var(--viraha-gold, #D4A843)" />
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: '50%',
            ml: '-44px',
            width: 88,
            height: 88,
            borderRadius: 1,
            border: '1.5px solid var(--viraha-gold, #D4A843)',
            bgcolor: 'background.paper',
            transform: 'rotate(-3deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Compass style={{ width: 44, height: 44, color: 'var(--viraha-gold, #D4A843)' }} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography
          sx={{
            fontFamily: 'var(--font-brand)',
            fontWeight: 600,
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--viraha-gold, #D4A843)',
          }}
        >
          Off the map · 404
        </Typography>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-accent)', fontWeight: 400 }}>
          Lost in transit
        </Typography>
        <Typography sx={{ color: 'text.secondary', maxWidth: 448 }}>
          This page seems to have wandered off the map. Let&apos;s get you back
          on track.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="contained"
          disableElevation
          component={Link}
          href="/home"
          sx={{
            bgcolor: 'var(--viraha-gold, #D4A843)',
            color: '#221C18',
            borderRadius: 1,
            fontWeight: 600,
            '&:hover': {
              bgcolor: 'warning.dark',
              boxShadow: '2px 2px 0 var(--viraha-hairline, rgba(34,28,24,0.15))',
            },
          }}
        >
          Go Home
        </Button>
        <Button
          variant="outlined"
          disableElevation
          component={Link}
          href="/explore"
          sx={{
            borderRadius: 1,
            borderColor: 'var(--viraha-hairline, rgba(34,28,24,0.15))',
            color: 'text.primary',
            '&:hover': { borderColor: 'var(--viraha-gold, #D4A843)' },
          }}
        >
          Explore
        </Button>
      </Box>
    </Box>
  );
}
