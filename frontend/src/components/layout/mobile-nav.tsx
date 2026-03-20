'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Globe, Plus, MapPin, LayoutGrid, BookMarked } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAuthHydrated } from '@/lib/stores/auth-store';

const tabs = [
  { href: '/explore', icon: Globe, label: 'Explore' },
  { href: '/map', icon: MapPin, label: 'Map' },
  { href: '/create/post', icon: Plus, label: 'Create', isFab: true as const },
  { href: '/albums', icon: LayoutGrid, label: 'Albums' },
  { href: '/journals', icon: BookMarked, label: 'Journals' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const hydrated = useAuthHydrated();

  if (!hydrated || !isAuthenticated) return null;

  const checkActive = (href: string) =>
    href === '/home'
      ? pathname === '/home' || pathname === '/'
      : pathname.startsWith(href);

  return (
    <Box
      component="nav"
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        bottom: 12,
        left: 12,
        right: 12,
        zIndex: 50,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          height: 64,
          px: 1,
          borderRadius: '32px',
          bgcolor: 'primary.main',
          boxShadow: '0 8px 32px rgba(var(--mui-palette-primary-mainChannel) / 0.35)',
          pb: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = checkActive(tab.href);

          if ('isFab' in tab && tab.isFab) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{ textDecoration: 'none', position: 'relative' }}
              >
                <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      height: 48,
                      width: 48,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: 'white',
                      color: 'primary.main',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    }}
                  >
                    <Plus size={24} strokeWidth={2.5} />
                  </Box>
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.25,
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  transition: 'all 0.2s',
                  color: isActive ? 'primary.main' : 'rgba(255,255,255,0.7)',
                }}
              >
                {/* Active pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 14,
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '14px',
                        bgcolor: 'white',
                      }}
                    />
                  </motion.div>
                )}

                <Box
                  component={tab.icon}
                  sx={{ width: 22, height: 22, position: 'relative', zIndex: 1 }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'inherit',
                    position: 'relative',
                    zIndex: 1,
                    lineHeight: 1,
                  }}
                >
                  {tab.label}
                </Typography>
              </Box>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
}

export { BottomNav as MobileNav };
