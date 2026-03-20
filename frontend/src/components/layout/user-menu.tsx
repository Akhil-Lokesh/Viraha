'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { logoutApi } from '@/lib/api/auth';
import { useState } from 'react';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import { Box, Typography } from '@mui/material';
import { User as UserIcon, Settings, LogOut, ChevronsUpDown } from 'lucide-react';
import type { User } from '@/lib/types';

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const initials = (user.displayName || user.username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = user.avatar
    ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${user.avatar}`
    : undefined;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  return (
    <>
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: 1.5,
          borderRadius: 2,
          px: 1.5,
          py: 1,
          textAlign: 'left',
          outline: 'none',
          transition: 'background-color 0.2s',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Avatar
          src={avatarUrl}
          alt={user.username}
          sx={{ width: 32, height: 32, flexShrink: 0, fontSize: '0.75rem' }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.displayName || user.username}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'text.secondary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            @{user.username}
          </Typography>
        </Box>
        <ChevronsUpDown
          size={16}
          style={{ flexShrink: 0 }}
        />
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 192, width: 192 } } }}
      >
        <MuiMenuItem onClick={() => { setAnchorEl(null); router.push(`/profile/${user.username}`); }} sx={{ fontSize: '0.875rem', borderRadius: 1, mx: 0.5 }}>
          <UserIcon size={16} style={{ marginRight: 8 }} />
          Profile
        </MuiMenuItem>
        <MuiMenuItem onClick={() => { setAnchorEl(null); router.push('/settings'); }} sx={{ fontSize: '0.875rem', borderRadius: 1, mx: 0.5 }}>
          <Settings size={16} style={{ marginRight: 8 }} />
          Settings
        </MuiMenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MuiMenuItem
          onClick={async () => {
            setAnchorEl(null);
            try {
              await logoutApi();
            } catch {
              // Still clear local state even if API call fails
            }
            logout();
            router.push('/');
          }}
          sx={{ fontSize: '0.875rem', borderRadius: 1, mx: 0.5, color: 'error.main', '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' } }}
        >
          <LogOut size={16} style={{ marginRight: 8 }} />
          Sign Out
        </MuiMenuItem>
      </Menu>
    </>
  );
}
