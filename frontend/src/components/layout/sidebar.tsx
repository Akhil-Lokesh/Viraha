'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Globe,
  MapPin,
  LayoutGrid,
  BookMarked,
  Waves,
  Plane,
  Route,
  Compass,
} from 'lucide-react';
import { Avatar, Box, ButtonBase, Tooltip } from '@mui/material';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAuthHydrated } from '@/lib/stores/auth-store';
import { useTravelMode, useUpdateTravelMode } from '@/lib/hooks/use-travel';
import { useTravelStore } from '@/lib/stores/travel-store';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/explore', icon: Globe, label: 'Explore' },
  { href: '/map', icon: MapPin, label: 'Map' },
  { href: '/albums', icon: LayoutGrid, label: 'Albums' },
  { href: '/journals', icon: BookMarked, label: 'Journals' },
  { href: '/journeys', icon: Route, label: 'Journeys' },
  { href: '/atlas', icon: Compass, label: 'Atlas' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const hydrated = useAuthHydrated();
  useTravelMode(); // keep query active to sync store
  const updateTravel = useUpdateTravelMode();
  const storeMode = useTravelStore((s) => s.mode);
  const setMode = useTravelStore((s) => s.setMode);

  if (!hydrated || !isAuthenticated) return null;

  const isActive = (href: string) =>
    href === '/home'
      ? pathname === '/home' || pathname === '/'
      : pathname.startsWith(href);

  const isTraveling = storeMode === 'traveling';

  const handleToggleTravel = () => {
    const newMode = isTraveling ? 'local' : 'traveling';
    // Update local state immediately so the toggle responds
    setMode(newMode);
    // Sync with backend in the background
    updateTravel.mutate({ mode: newMode });
  };

  const profileActive = pathname.startsWith('/profile');

  return (
    <Box
      component="aside"
      sx={{
        display: { xs: 'none', md: 'flex' },
        position: 'fixed',
        left: '20px',
        top: '12px',
        bottom: '12px',
        zIndex: 40,
        height: 'calc(100vh - 24px)',
        width: 72,
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'primary.main',
        borderRadius: '36px',
        boxShadow: '0 8px 32px rgba(var(--mui-palette-primary-mainChannel) / 0.25)',
        py: 3,
      }}
    >
      {/* Logo */}
      <Link href="/home" style={{ textDecoration: 'none', marginBottom: 24 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.08)',
            },
          }}
        >
          <Waves size={22} color="#7B68EE" />
        </Box>
      </Link>

      {/* Navigation */}
      <Box
        component="nav"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          justifyContent: 'center',
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Tooltip key={item.href} title={item.label} placement="right" arrow>
              <Link
                href={item.href}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    '&:hover': !active
                      ? {
                          bgcolor: 'rgba(255, 255, 255, 0.15)',
                        }
                      : {},
                  }}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        backgroundColor: 'white',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <Box
                    component={item.icon}
                    sx={{
                      position: 'relative',
                      zIndex: 10,
                      width: 22,
                      height: 22,
                      color: active
                        ? 'primary.main'
                        : 'rgba(255, 255, 255, 0.7)',
                      transition: 'color 0.2s',
                    }}
                  />
                </Box>
              </Link>
            </Tooltip>
          );
        })}
      </Box>

      {/* Bottom — Travel Toggle + Profile */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Travel Mode Toggle */}
        <Tooltip
          title={isTraveling ? 'Traveling mode' : 'Local mode'}
          placement="right"
          arrow
        >
          <ButtonBase
            onClick={handleToggleTravel}
            sx={{
              position: 'relative',
              width: 38,
              height: 68,
              borderRadius: '19px',
              bgcolor: isTraveling
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              overflow: 'hidden',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
              },
            }}
          >
            {/* Sliding thumb with icon */}
            <motion.div
              animate={{
                top: isTraveling ? 'calc(100% - 28px - 5px)' : '5px',
              }}
              whileTap={{ scaleX: 1.15, scaleY: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                position: 'absolute',
                left: '50%',
                marginLeft: -14,
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--mui-palette-surfaceContainerHighest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              }}
            >
              <motion.div
                key={isTraveling ? 'plane' : 'home'}
                initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isTraveling ? (
                  <Plane size={14} color="#FFFFFF" />
                ) : (
                  <Home size={14} color="#FFFFFF" />
                )}
              </motion.div>
            </motion.div>
          </ButtonBase>
        </Tooltip>

        {/* Profile Avatar */}
        {user && (
          <Tooltip title="Profile" placement="right" arrow>
            <Link
              href={`/profile/${user.username}`}
              style={{ textDecoration: 'none' }}
            >
              <Avatar
                src={user.avatar || undefined}
                alt={user.displayName || user.username}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: 'primary.main',
                  fontSize: 16,
                  fontWeight: 600,
                  border: profileActive
                    ? '2px solid white'
                    : '2px solid transparent',
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                  },
                }}
              >
                {(user.displayName || user.username || '?')
                  .charAt(0)
                  .toUpperCase()}
              </Avatar>
            </Link>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
