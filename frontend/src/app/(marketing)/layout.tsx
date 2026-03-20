'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { Footer } from '@/components/layout/footer';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: 'all 0.5s ease-out',
          ...(scrolled
            ? {
                bgcolor: 'rgba(var(--mui-palette-background-defaultChannel) / 0.8)',
                backdropFilter: 'blur(16px)',
                borderBottom: 1,
                borderColor: 'divider',
                boxShadow: 1,
              }
            : {
                bgcolor: 'transparent',
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
                    fontFamily: 'var(--font-brand)',
                    fontWeight: 600,
                    transition: 'color 0.5s',
                    color: scrolled ? 'primary.main' : 'white',
                  }}
                >
                  Viraha
                </Typography>
              </Box>
            </Link>

            {/* Center nav links — desktop */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
              <Link href="/#features" style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'color 0.3s',
                    '&:hover': { opacity: 0.8 },
                    color: scrolled ? 'text.primary' : 'rgba(255,255,255,0.9)',
                  }}
                >
                  Features
                </Box>
              </Link>
              <Link href="/about" style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'color 0.3s',
                    '&:hover': { opacity: 0.8 },
                    color: scrolled ? 'text.primary' : 'rgba(255,255,255,0.9)',
                  }}
                >
                  About
                </Box>
              </Link>
            </Box>

            {/* Right side buttons — desktop */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="text"
                disableElevation
                size="small"
                component={Link}
                href="/sign-in"
                sx={{
                  transition: 'color 0.3s',
                  ...(scrolled
                    ? { color: 'text.primary', '&:hover': { bgcolor: 'rgba(var(--mui-palette-secondary-mainChannel) / 0.1)' } }
                    : { color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }),
                }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                disableElevation
                size="small"
                component={Link}
                href="/sign-up"
                sx={{
                  transition: 'all 0.3s',
                  borderRadius: '9999px',
                  px: 2.5,
                  ...(scrolled
                    ? {
                        bgcolor: 'secondary.main',
                        color: 'secondary.contrastText',
                        '&:hover': { bgcolor: 'secondary.dark' },
                      }
                    : {
                        bgcolor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        border: 1,
                        borderColor: 'rgba(255,255,255,0.3)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                        backdropFilter: 'blur(4px)',
                      }),
                }}
              >
                Get Started
              </Button>
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
                color: scrolled || mobileMenuOpen ? 'text.primary' : 'white',
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
                bgcolor: 'rgba(var(--mui-palette-background-defaultChannel) / 0.95)',
                backdropFilter: 'blur(16px)',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ maxWidth: 1280, mx: 'auto', px: 2, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Link href="/#features" style={{ textDecoration: 'none' }}>
                  <Box
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'text.primary', py: 1 }}
                  >
                    Features
                  </Box>
                </Link>
                <Link href="/about" style={{ textDecoration: 'none' }}>
                  <Box
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'text.primary', py: 1 }}
                  >
                    About
                  </Box>
                </Link>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button variant="outlined" disableElevation sx={{ width: '100%' }} component={Link} href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    disableElevation
                    sx={{ width: '100%', bgcolor: 'secondary.main', color: 'secondary.contrastText', '&:hover': { bgcolor: 'secondary.dark' } }}
                    component={Link}
                    href="/sign-up"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Button>
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
  );
}
