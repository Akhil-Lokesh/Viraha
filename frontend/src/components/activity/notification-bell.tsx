'use client';

import { Bell } from 'lucide-react';
import { Box } from '@mui/material';
import { useUnreadCount } from '@/lib/hooks/use-activities';
import { useNotificationStream } from '@/lib/hooks/use-notification-stream';

interface NotificationBellProps {
  size?: number;
  color?: string;
  showCount?: boolean;
}

export function NotificationBell({
  size = 22,
  color = 'currentColor',
  showCount = false,
}: NotificationBellProps) {
  useNotificationStream();
  const { data: unread = 0 } = useUnreadCount();
  const hasUnread = unread > 0;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <Bell size={size} color={color} />
      {hasUnread && (
        <Box
          aria-label={`${unread} unread notification${unread === 1 ? '' : 's'}`}
          sx={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: showCount ? 16 : 8,
            height: showCount ? 16 : 8,
            px: showCount ? '4px' : 0,
            borderRadius: '9999px',
            bgcolor: '#EF4444',
            color: '#fff',
            fontSize: '0.625rem',
            fontWeight: 700,
            lineHeight: '16px',
            textAlign: 'center',
            border: '2px solid white',
            boxSizing: 'content-box',
          }}
        >
          {showCount ? (unread > 99 ? '99+' : unread) : null}
        </Box>
      )}
    </Box>
  );
}
