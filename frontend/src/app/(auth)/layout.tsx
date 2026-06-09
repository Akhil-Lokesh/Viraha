'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuthStore, useAuthHydrated } from '@/lib/stores/auth-store';
import { fadeIn } from '@/lib/animations';

const PANEL_INK = '#16121F'; // brand panel stays deep ink-plum in both modes
const PANEL_CREAM = '#F3EDE3';
const PANEL_GOLD = '#E2BC5C';

const stamps: Array<{ label: string; top: string; left?: string; right?: string; rotate: string }> = [
  { label: '48.8566° N · 2.3522° E', top: '14%', left: '10%', rotate: '-3deg' },
  { label: 'Kyoto · Field Notes', top: '26%', right: '12%', rotate: '2deg' },
  { label: 'Stamped · Viraha', top: '74%', left: '14%', rotate: '-1.5deg' },
];

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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* Left half -- brand panel: ink-plum paper, stamps, drifting flight path (desktop only) */}
      <Box
        className="paper-grain"
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          width: '50%',
          overflow: 'hidden',
          bgcolor: PANEL_INK,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Drifting dashed flight path across the panel */}
        <Box
          component="svg"
          viewBox="0 0 600 800"
          preserveAspectRatio="none"
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0.55,
          }}
        >
          <path
            d="M -40 620 C 140 520, 180 360, 320 320 S 560 220, 660 80"
            fill="none"
            stroke={PANEL_GOLD}
            strokeWidth="1.5"
            strokeDasharray="8 10"
            style={{ animation: 'flight-drift 14s linear infinite' }}
          />
          <circle cx="320" cy="320" r="3.5" fill={PANEL_GOLD} />
        </Box>

        {/* Rotated passport stamps */}
        {stamps.map((stamp) => (
          <Box
            key={stamp.label}
            className="stamp"
            sx={{
              position: 'absolute',
              top: stamp.top,
              left: stamp.left,
              right: stamp.right,
              '--stamp-rotate': stamp.rotate,
              color: PANEL_CREAM,
              borderColor: PANEL_GOLD,
              opacity: 0.85,
            }}
          >
            {stamp.label}
          </Box>
        ))}

        {/* Oversized brand moment */}
        <Box sx={{ position: 'relative', zIndex: 10, textAlign: 'center', px: 6 }}>
          <Typography
            sx={{
              fontFamily: 'var(--font-brand)',
              fontWeight: 600,
              fontSize: '0.75rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: PANEL_GOLD,
              mb: 2,
            }}
          >
            A travel memory journal
          </Typography>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Typography
              component="span"
              sx={{
                display: 'block',
                fontFamily: 'var(--font-accent)',
                fontSize: 'clamp(4rem, 9vw, 7rem)',
                lineHeight: 1,
                color: PANEL_CREAM,
              }}
            >
              Viraha
            </Typography>
          </Link>
          <Box
            className="flight-path"
            sx={{ width: 120, mx: 'auto', my: 3, borderTopColor: PANEL_GOLD }}
          />
          <Typography
            sx={{
              color: 'rgba(243, 237, 227, 0.75)',
              fontSize: '1.05rem',
              maxWidth: 340,
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            The ache of separation from what you love.
            Preserve your travel memories forever.
          </Typography>
        </Box>
      </Box>

      {/* Right half -- centered auth form on warm paper */}
      <Box
        component={motion.div}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="paper-grain"
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'var(--viraha-paper, #FAF6EE)',
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
          {/* Mobile brand moment (hidden on desktop since it is on the left panel) */}
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
              textAlign: 'center',
              mb: 5,
            }}
          >
            <Typography
              sx={{
                fontFamily: 'var(--font-brand)',
                fontWeight: 600,
                fontSize: '0.7rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--viraha-gold, #D4A843)',
                mb: 1,
              }}
            >
              A travel memory journal
            </Typography>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Typography
                component="span"
                sx={{
                  display: 'block',
                  fontFamily: 'var(--font-accent)',
                  fontSize: '3rem',
                  lineHeight: 1.1,
                  color: 'var(--viraha-ink, #221C18)',
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
