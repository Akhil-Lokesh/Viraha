'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Globe,
  Plus,
  MapPin,
  LayoutGrid,
  BookMarked,
  Bookmark,
  Route,
  Compass,
  Bell,
  Menu,
  ScrollText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Box, Typography, Drawer } from '@mui/material';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAuthHydrated } from '@/lib/stores/auth-store';

interface NavTab {
  href: string;
  icon: LucideIcon;
  label: string;
  isFab?: true;
}

const tabs: NavTab[] = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/explore', icon: Globe, label: 'Explore' },
  { href: '/create/post', icon: Plus, label: 'Create', isFab: true },
  { href: '/map', icon: MapPin, label: 'Map' },
];

// Destinations surfaced through the "More" sheet so the bar stays clean.
const moreItems: { href: string; icon: LucideIcon; label: string }[] = [
  { href: '/albums', icon: LayoutGrid, label: 'Albums' },
  { href: '/scrapbooks', icon: ScrollText, label: 'Scrapbooks' },
  { href: '/journals', icon: BookMarked, label: 'Journals' },
  { href: '/journeys', icon: Route, label: 'Journeys' },
  { href: '/saved', icon: Bookmark, label: 'Saved' },
  { href: '/atlas', icon: Compass, label: 'Atlas' },
  { href: '/activity', icon: Bell, label: 'Activity' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const hydrated = useAuthHydrated();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!hydrated || !isAuthenticated) return null;

  const checkActive = (href: string) =>
    href === '/home'
      ? pathname === '/home' || pathname === '/'
      : pathname.startsWith(href);

  const moreActive = moreItems.some((item) => pathname.startsWith(item.href));

  const navItemSx = (isActive: boolean) =>
    ({
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
    }) as const;

  return (
    <>
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

            if (tab.isFab) {
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
                <Box sx={navItemSx(isActive)}>
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

          {/* More — opens a sheet with the remaining destinations */}
          <Box
            component="button"
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="More navigation"
            aria-expanded={moreOpen}
            sx={{
              ...navItemSx(moreActive),
              border: 'none',
              bgcolor: 'transparent',
              cursor: 'pointer',
              p: 0,
            }}
          >
            {moreActive && (
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
              component={Menu}
              sx={{ width: 22, height: 22, position: 'relative', zIndex: 1 }}
              strokeWidth={moreActive ? 2.5 : 2}
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
              More
            </Typography>
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="bottom"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              pb: 'env(safe-area-inset-bottom, 0px)',
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 4,
              borderRadius: 2,
              bgcolor: 'divider',
              mx: 'auto',
              mb: 2,
            }}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1.5,
            }}
          >
            {moreItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.75,
                      py: 2,
                      borderRadius: 3,
                      bgcolor: active
                        ? 'rgba(var(--mui-palette-primary-mainChannel) / 0.12)'
                        : 'action.hover',
                      color: active ? 'primary.main' : 'text.primary',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Box component={item.icon} sx={{ width: 24, height: 24 }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                      {item.label}
                    </Typography>
                  </Box>
                </Link>
              );
            })}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

export { BottomNav as MobileNav };
