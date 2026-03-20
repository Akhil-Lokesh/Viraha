'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogTitle,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { X } from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import { getFollowers, getFollowing } from '@/lib/api/follows';

interface FollowUser {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

interface FollowListDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
}

export function FollowListDialog({ open, onClose, userId, type }: FollowListDialogProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (nextCursor?: string) => {
    setLoading(true);
    try {
      const fetcher = type === 'followers' ? getFollowers : getFollowing;
      const res = await fetcher(userId, nextCursor);
      setUsers((prev) => nextCursor ? [...prev, ...res.items] : res.items);
      setCursor(res.nextCursor);
      setHasMore(!!res.nextCursor);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [userId, type]);

  useEffect(() => {
    if (open) {
      setUsers([]);
      setCursor(null);
      setHasMore(true);
      fetchPage();
    }
  }, [open, fetchPage]);

  const handleScroll = () => {
    if (!listRef.current || loading || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      fetchPage(cursor ?? undefined);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px', maxHeight: '70vh' },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
          {type === 'followers' ? 'Followers' : 'Following'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <X style={{ width: 18, height: 18 }} />
        </IconButton>
      </DialogTitle>

      <Box
        ref={listRef}
        onScroll={handleScroll}
        sx={{
          overflowY: 'auto',
          px: 2,
          pb: 2,
          minHeight: 200,
        }}
      >
        {users.map((u) => (
          <Link
            key={u.id}
            href={`/profile/${u.username}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
            onClick={onClose}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1.5,
                px: 1,
                borderRadius: '12px',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background-color 0.15s',
              }}
            >
              <UserAvatar
                src={u.avatar}
                username={u.username}
                displayName={u.displayName}
                size="sm"
                link={false}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.displayName || u.username}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  @{u.username}
                </Typography>
              </Box>
            </Box>
          </Link>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && users.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
