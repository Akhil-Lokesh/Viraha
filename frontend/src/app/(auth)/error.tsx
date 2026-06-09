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
      className="paper-grain"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: 'var(--viraha-paper, #FAF6EE)',
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
        <Typography
          sx={{
            fontFamily: 'var(--font-brand)',
            fontWeight: 600,
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--viraha-gold, #D4A843)',
            mb: 1,
          }}
        >
          Turbulence · Unexpected error
        </Typography>
        <Typography variant="h5" sx={{ mb: 2, fontFamily: 'var(--font-accent)', fontWeight: 400 }}>
          Something went wrong
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          We encountered an error. Please try again.
        </Typography>
        <Button
          variant="contained"
          onClick={reset}
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
          Try again
        </Button>
      </Box>
    </Box>
  );
}
