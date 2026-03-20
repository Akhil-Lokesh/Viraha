'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '@/lib/hooks/use-auth';
import { useAuthHydrated } from '@/lib/stores/auth-store';
import { useUnreadCount } from '@/lib/hooks/use-activities';
import { UserAvatar } from '@/components/shared/user-avatar';
import { TravelModeIndicator } from '@/components/travel/travel-mode-indicator';

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const hydrated = useAuthHydrated();
  const [scrolled, setScrolled] = useState(false);
  const { data: unreadCount = 0 } = useUnreadCount();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        display: { xs: 'block', md: 'none' },
        pt: 'env(safe-area-inset-top, 0px)',
        transition: 'all 0.3s',
        ...(scrolled
          ? {
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(24px) saturate(180%)',
              borderBottom: 1,
              borderColor: 'var(--mui-palette-outlineVariant)',
              boxShadow: 1,
            }
          : {
              bgcolor: 'transparent',
            }),
      }}
    >
      <Box
        sx={{
          display: 'flex',
          height: 52,
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography
            sx={{
              fontSize: '1.25rem',
              fontFamily: 'var(--font-brand)',
              fontWeight: 600,
              letterSpacing: '-0.025em',
              transition: 'color 0.3s',
              color: scrolled ? 'primary.main' : 'text.primary',
            }}
          >
            Viraha
          </Typography>
        </Link>

        {/* Right side actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          {/* Home — links to dashboard, also shows travel mode */}
          <Link
            href="/home"
            style={{ textDecoration: 'none', color: 'inherit' }}
            aria-label="Home"
          >
            <Box
              sx={{
                display: 'flex',
                height: 44,
                width: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'color 0.2s, background-color 0.2s',
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <TravelModeIndicator variant="compact" />
            </Box>
          </Link>

          {/* Notification bell */}
          <Link
            href="/activity"
            style={{ textDecoration: 'none', color: 'inherit' }}
            aria-label="Notifications"
          >
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                height: 44,
                width: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'color 0.2s, background-color 0.2s',
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    height: 8,
                    width: 8,
                    borderRadius: '50%',
                    bgcolor: 'secondary.main',
                    boxShadow: (theme) =>
                      `0 0 0 2px ${theme.palette.background.default}`,
                  }}
                />
              )}
            </Box>
          </Link>

          {/* User avatar */}
          {user && (
            <UserAvatar
              src={
                user.avatar
                  ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${user.avatar}`
                  : undefined
              }
              username={user.username}
              displayName={user.displayName}
              size="sm"
              link
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
