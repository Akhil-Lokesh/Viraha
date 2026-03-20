'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuthStore } from '@/lib/stores/auth-store';
import { heroPhotos } from '@/lib/mock-data';
import { fadeIn } from '@/lib/animations';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  if (user) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Left half -- full-bleed travel photo (desktop only) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          width: '50%',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={heroPhotos[1]}
          alt="Travel inspiration"
          sx={{
            position: 'absolute',
            inset: 0,
            height: '100%',
            width: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Gradient overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(45, 31, 78, 0.8), rgba(45, 31, 78, 0.3), rgba(45, 31, 78, 0.1))',
          }}
        />
        {/* Logo + tagline at bottom-left */}
        <Box sx={{ position: 'absolute', bottom: 48, left: 48, zIndex: 10 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: '3rem',
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'var(--font-brand)',
                letterSpacing: '-0.025em',
              }}
            >
              Viraha
            </Typography>
          </Link>
          <Typography
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              mt: 1.5,
              fontSize: '1.125rem',
              maxWidth: 320,
              lineHeight: 1.7,
            }}
          >
            The ache of separation from what you love.
            Preserve your travel memories forever.
          </Typography>
        </Box>
      </Box>

      {/* Right half -- centered auth form */}
      <Box
        component={motion.div}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Box
          sx={{
            maxWidth: 448,
            width: '100%',
            mx: 'auto',
            px: 3,
            py: 6,
          }}
        >
          {/* Mobile logo (hidden on desktop since it is on the left panel) */}
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              textAlign: 'center',
              mb: 5,
            }}
          >
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Typography
                variant="h3"
                sx={{
                  fontSize: '2.25rem',
                  fontWeight: 700,
                  color: 'primary.main',
                  fontFamily: 'var(--font-brand)',
                  letterSpacing: '-0.025em',
                }}
              >
                Viraha
              </Typography>
            </Link>
            <Typography
              sx={{
                color: 'text.secondary',
                mt: 1,
                fontSize: '0.875rem',
              }}
            >
              The ache of separation from what you love
            </Typography>
          </Box>

          {children}
        </Box>
      </Box>
    </Box>
  );
}
