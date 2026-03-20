'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Something went wrong
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          We encountered an error loading this page.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={reset}>
            Try again
          </Button>
          <Button variant="outlined" component={Link} href="/">
            Go home
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
