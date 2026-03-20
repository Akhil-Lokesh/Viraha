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
      <Box
        sx={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: 'action.selected',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Compass style={{ width: 48, height: 48, color: 'var(--mui-palette-text-secondary)' }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Lost in transit</Typography>
        <Typography sx={{ color: 'text.secondary', maxWidth: 448 }}>
          This page seems to have wandered off the map. Let&apos;s get you back
          on track.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button variant="contained" disableElevation component={Link} href="/home">
          Go Home
        </Button>
        <Button variant="outlined" disableElevation component={Link} href="/explore">
          Explore
        </Button>
      </Box>
    </Box>
  );
}
