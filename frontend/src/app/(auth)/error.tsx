'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function AuthError({
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
          We encountered an error. Please try again.
        </Typography>
        <Button variant="contained" onClick={reset}>
          Try again
        </Button>
      </Box>
    </Box>
  );
}
