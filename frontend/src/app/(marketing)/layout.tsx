'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { Footer } from '@/components/layout/footer';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { GlowButton } from '@/components/cinema';

const navLinkSx = {
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--cin-text-muted)',
  transition: 'color 0.2s',
  '&:hover': { color: 'var(--cin-text)' },
} as const;

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'var(--cin-bg)',
        }}
      >
        {/* Navbar */}
        <Box
          component="header"
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            transition: 'background-color 0.4s ease-out, border-color 0.4s ease-out',
            ...(scrolled
              ? {
                  bgcolor: 'rgba(11,11,15,0.8)',
                  backdropFilter: 'blur(16px)',
                  borderBottom: '1px solid var(--cin-hairline)',
                }
              : {
                  bgcolor: 'transparent',
                  borderBottom: '1px solid transparent',
                }),
          }}
        >
          <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 3 } }}>
            <Box
              component="nav"
              sx={{
                display: 'flex',
                height: { xs: 64, md: 80 },
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {/* Logo */}
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Box sx={{ position: 'relative', zIndex: 10 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: '1.5rem', md: '1.875rem' },
                      fontFamily: 'Posterama, var(--font-body)',
                      fontWeight: 600,
                      color: 'var(--cin-text)',
                    }}
                  >
                    Viraha
                  </Typography>
                </Box>
              </Link>

              {/* Center nav links — desktop */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
                <Link href="/#features" style={{ textDecoration: 'none' }}>
                  <Box sx={navLinkSx}>Features</Box>
                </Link>
                <Link href="/about" style={{ textDecoration: 'none' }}>
                  <Box sx={navLinkSx}>About</Box>
                </Link>
              </Box>

              {/* Right side buttons — desktop */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                <GlowButton
                  variant="ghost"
                  size="small"
                  component={Link}
                  href="/sign-in"
                  sx={{ border: 'none', color: 'var(--cin-text)' }}
                >
                  Sign In
                </GlowButton>
                <GlowButton size="small" component={Link} href="/sign-up">
                  Get Started
                </GlowButton>
              </Box>

              {/* Mobile menu button */}
              <Box
                component="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                sx={{
                  display: { xs: 'block', md: 'none' },
                  position: 'relative',
                  zIndex: 10,
                  p: 1,
                  mr: -1,
                  transition: 'color 0.2s',
                  bgcolor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--cin-text)',
                }}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X style={{ height: 20, width: 20 }} />
                ) : (
                  <Menu style={{ height: 20, width: 20 }} />
                )}
              </Box>
            </Box>
          </Box>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <Box
                component={motion.div}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                sx={{
                  display: { xs: 'block', md: 'none' },
                  overflow: 'hidden',
                  bgcolor: 'rgba(11,11,15,0.95)',
                  backdropFilter: 'blur(16px)',
                  borderBottom: '1px solid var(--cin-hairline)',
                }}
              >
                <Box sx={{ maxWidth: 1280, mx: 'auto', px: 2, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Link href="/#features" style={{ textDecoration: 'none' }}>
                    <Box
                      onClick={() => setMobileMenuOpen(false)}
                      sx={{ ...navLinkSx, display: 'block', py: 1 }}
                    >
                      Features
                    </Box>
                  </Link>
                  <Link href="/about" style={{ textDecoration: 'none' }}>
                    <Box
                      onClick={() => setMobileMenuOpen(false)}
                      sx={{ ...navLinkSx, display: 'block', py: 1 }}
                    >
                      About
                    </Box>
                  </Link>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      pt: 2,
                      borderTop: '1px solid var(--cin-hairline)',
                    }}
                  >
                    <GlowButton
                      variant="ghost"
                      fullWidth
                      component={Link}
                      href="/sign-in"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </GlowButton>
                    <GlowButton
                      fullWidth
                      component={Link}
                      href="/sign-up"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </GlowButton>
                  </Box>
                </Box>
              </Box>
            )}
          </AnimatePresence>
        </Box>

        {/* Page content — full width, no constraints */}
        <Box component="main" sx={{ flex: 1 }}>{children}</Box>

        {/* Footer */}
        <Footer />
      </Box>
    </MotionConfig>
  );
}
