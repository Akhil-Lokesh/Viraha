'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { PhotoTile } from '@/components/cinema';
import { displaySx, eyebrowSx } from '@/lib/design/cinema-tokens';
import { useAuthStore, useAuthHydrated } from '@/lib/stores/auth-store';
import { fadeIn } from '@/lib/animations';

const PANEL_PHOTO =
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  // Wait for the persisted store to hydrate before deciding what to render,
  // otherwise logged-in users briefly see the sign-in form on a hard reload.
  if (!hydrated) return null;

  if (user) return null;

  return (
    <MotionConfig reducedMotion="user">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          bgcolor: 'var(--cin-bg)',
        }}
      >
        {/* Left panel (lg+) — full-bleed travel photo, the light source */}
        <Box
          sx={{
            display: { xs: 'none', lg: 'block' },
            position: 'relative',
            width: '50%',
          }}
        >
          <PhotoTile
            src={PANEL_PHOTO}
            alt="Evening light over Paris rooftops"
            rounded={0}
            sx={{ position: 'absolute', inset: 0, height: '100%' }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                p: { lg: 6, xl: 8 },
              }}
            >
              <Typography sx={{ ...eyebrowSx, mb: 1.5 }}>
                A travel memory journal
              </Typography>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Typography
                  component="span"
                  sx={{
                    ...displaySx,
                    display: 'block',
                    fontSize: 'clamp(3.5rem, 7vw, 6rem)',
                  }}
                >
                  Viraha
                </Typography>
              </Link>
              <Typography
                sx={{
                  color: 'var(--cin-text-muted)',
                  mt: 2,
                  maxWidth: 380,
                  lineHeight: 1.65,
                }}
              >
                The ache of separation from what you love — keep every journey
                close.
              </Typography>
            </Box>
          </PhotoTile>
        </Box>

        {/* Right panel — dark form */}
        <Box
          component={motion.div}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          sx={{
            width: { xs: '100%', lg: '50%' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            bgcolor: 'var(--cin-bg)',
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
            {/* Mobile/tablet brand moment (hidden on lg+ — it lives on the photo panel) */}
            <Box
              sx={{
                display: { xs: 'block', lg: 'none' },
                textAlign: 'center',
                mb: 5,
              }}
            >
              <Typography sx={{ ...eyebrowSx, mb: 1 }}>
                A travel memory journal
              </Typography>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Typography
                  component="span"
                  sx={{ ...displaySx, display: 'block', fontSize: '2.75rem' }}
                >
                  Viraha
                </Typography>
              </Link>
              <Typography
                sx={{
                  color: 'var(--cin-text-muted)',
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
    </MotionConfig>
  );
}
