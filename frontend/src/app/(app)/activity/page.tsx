'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import {
  Bell,
  UserPlus,
  MessageCircle,
  Bookmark,
  Reply,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { useActivities, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/lib/hooks/use-activities';
import {
  usePendingFollowRequests,
  useAcceptFollowRequest,
  useRejectFollowRequest,
} from '@/lib/hooks/use-follows';
import { UserAvatar } from '@/components/shared/user-avatar';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import type { Activity } from '@/lib/types';
import type { FollowRequest } from '@/lib/api/follows';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

function resolveImageUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

const activityIcons = {
  follow: UserPlus,
  follow_request: UserPlus,
  follow_accepted: CheckCheck,
  comment: MessageCircle,
  reply: Reply,
  save: Bookmark,
} as const;

const activityColors = {
  follow: { bgcolor: 'rgba(59,130,246,0.1)', color: '#2563EB' },
  follow_request: { bgcolor: 'rgba(59,130,246,0.1)', color: '#2563EB' },
  follow_accepted: { bgcolor: 'rgba(16,185,129,0.1)', color: '#059669' },
  comment: { bgcolor: 'rgba(16,185,129,0.1)', color: '#059669' },
  reply: { bgcolor: 'rgba(139,92,246,0.1)', color: '#7C3AED' },
  save: { bgcolor: 'rgba(245,158,11,0.1)', color: '#D97706' },
} as const;

const defaultActivityColor = { bgcolor: 'rgba(107,114,128,0.1)', color: '#4B5563' } as const;

function activityMessage(activity: Activity): string {
  switch (activity.type) {
    case 'follow':
      return 'started following you';
    case 'follow_request':
      return 'requested to follow you';
    case 'follow_accepted':
      return 'accepted your follow request';
    case 'comment':
      return 'commented on your post';
    case 'reply':
      return 'replied to your comment';
    case 'save':
      return 'saved your post';
    default:
      return 'interacted with you';
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

function ActivityItem({
  activity,
  onMarkRead,
}: {
  activity: Activity;
  onMarkRead: (id: string) => void;
}) {
  const Icon = activityIcons[activity.type] ?? Bell;
  const colorStyle = activityColors[activity.type] ?? defaultActivityColor;
  const thumb = activity.post?.mediaThumbnails?.[0] || activity.post?.mediaUrls?.[0];

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: { xs: 0, md: '12px' },
        borderBottom: { xs: 1, md: 0 },
        borderColor: 'divider',
        transition: 'background-color 0.2s',
        cursor: !activity.read ? 'pointer' : 'default',
        ...(!activity.read
          ? { bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.05)' }
          : { '&:hover': { bgcolor: 'action.hover' } }),
      }}
      onClick={() => !activity.read && onMarkRead(activity.id)}
    >
      {/* Actor avatar */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        {activity.actor && (
          <UserAvatar
            src={activity.actor.avatar}
            username={activity.actor.username}
            displayName={activity.actor.displayName}
            size="sm"
            link
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 20,
            height: 20,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: colorStyle.bgcolor,
            color: colorStyle.color,
          }}
        >
          <Icon style={{ height: 10, width: 10 }} />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2">
          <Link href={`/profile/${activity.actor?.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Box
              component="span"
              sx={{ fontWeight: 600, color: 'text.primary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {activity.actor?.displayName || activity.actor?.username}
            </Box>
          </Link>{' '}
          <Box component="span" sx={{ color: 'text.secondary' }}>{activityMessage(activity)}</Box>
        </Typography>
        {activity.comment && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            &ldquo;{activity.comment.text}&rdquo;
          </Typography>
        )}
        <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7, mt: 0.5, display: 'block' }}>
          {timeAgo(activity.createdAt)}
        </Typography>
      </Box>

      {/* Post thumbnail */}
      {thumb && activity.postId && (
        <Link href={`/post/${activity.postId}`} aria-label="View post" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box sx={{ flexShrink: 0 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '8px', overflow: 'hidden', border: 1, borderColor: 'divider' }}>
              <img
                src={resolveImageUrl(thumb)}
                alt="View post"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </Box>
        </Link>
      )}

      {/* Unread indicator */}
      {!activity.read && (
        <Box sx={{ flexShrink: 0, mt: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
        </Box>
      )}
    </Box>
  );
}

function FollowRequestRow({ request }: { request: FollowRequest }) {
  const accept = useAcceptFollowRequest();
  const reject = useRejectFollowRequest();
  const pending = accept.isPending || reject.isPending;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: { xs: 0, md: '12px' },
        borderBottom: { xs: 1, md: 0 },
        borderColor: 'divider',
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <UserAvatar
          src={request.avatar}
          username={request.username}
          displayName={request.displayName}
          size="sm"
          link
        />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2">
          <Link href={`/profile/${request.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary', '&:hover': { textDecoration: 'underline' } }}>
              {request.displayName || request.username}
            </Box>
          </Link>{' '}
          <Box component="span" sx={{ color: 'text.secondary' }}>requested to follow you</Box>
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          disableElevation
          sx={{ borderRadius: '9999px', px: 2, fontSize: '0.75rem', fontWeight: 600 }}
          onClick={() => {
            accept.mutate(request.followId, {
              onSuccess: () => toast.success(`Accepted @${request.username}`),
              onError: () => toast.error('Could not accept request'),
            });
          }}
          disabled={pending}
        >
          {accept.isPending ? (
            <Loader2 style={{ height: 12, width: 12, animation: 'spin 1s linear infinite' }} />
          ) : (
            'Accept'
          )}
        </Button>
        <Button
          variant="outlined"
          size="small"
          disableElevation
          sx={{ borderRadius: '9999px', px: 2, fontSize: '0.75rem', fontWeight: 600 }}
          onClick={() => {
            reject.mutate(request.followId, {
              onSuccess: () => toast.success('Request declined'),
              onError: () => toast.error('Could not decline request'),
            });
          }}
          disabled={pending}
        >
          {reject.isPending ? (
            <Loader2 style={{ height: 12, width: 12, animation: 'spin 1s linear infinite' }} />
          ) : (
            'Decline'
          )}
        </Button>
      </Box>
    </Box>
  );
}

function FollowRequestsSection() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePendingFollowRequests();

  const requests = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  // Hide the section entirely while loading, on error, or when empty — it is a
  // supplementary panel above the main feed and should not show its own error UI.
  if (isLoading || isError || requests.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', px: { xs: 2, md: 0 }, mb: 1 }}>
        Follow requests
        <Box component="span" sx={{ ml: 1, fontWeight: 400, color: 'text.secondary' }}>
          ({requests.length})
        </Box>
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mx: { xs: -2, md: 0 } }}>
        {requests.map((request) => (
          <FollowRequestRow key={request.followId} request={request} />
        ))}
        {hasNextPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
            <Button
              variant="text"
              disableElevation
              size="small"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <Loader2 style={{ height: 16, width: 16, animation: 'spin 1s linear infinite', marginRight: 8 }} />
              ) : null}
              Load more requests
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function ActivityContent() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivities();

  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Pending follow requests are surfaced by the actionable FollowRequestsSection
  // above. Suppress the passive 'follow_request' rows here so a pending request
  // shows exactly once (in the actionable section), not duplicated in this feed.
  const activities = useMemo(
    () =>
      data?.pages
        .flatMap((page) => page.items)
        .filter((activity) => activity.type !== 'follow_request') ?? [],
    [data]
  );

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      sx={{ maxWidth: 672, mx: 'auto' }}
    >
      {/* Page heading */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component={motion.div}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '12px',
              bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.1)',
            }}
          >
            <Bell style={{ height: 20, width: 20, color: 'var(--mui-palette-primary-main)' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: 'text.primary' }}>
              Activity
            </Typography>
            {unreadCount > 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {unreadCount} unread
              </Typography>
            )}
          </Box>
        </Box>

        {unreadCount > 0 && (
          <Button
            variant="text"
            disableElevation
            size="small"
            sx={{ gap: 0.75, fontSize: '0.75rem' }}
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck style={{ height: 14, width: 14 }} />
            Mark all read
          </Button>
        )}
      </Box>

      {/* Pending follow requests (private accounts) */}
      <FollowRequestsSection />

      {/* Activity list */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
              <Skeleton variant="rounded" animation="pulse" sx={{ height: 36, width: 36, borderRadius: '50%' }} />
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: '75%' }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: '25%' }} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : activities.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, textAlign: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'action.selected',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Bell style={{ width: 32, height: 32, color: 'var(--mui-palette-text-secondary)' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>No activity yet</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 320 }}>
            When someone follows you, comments on your posts, or saves your memories, you&apos;ll see it here.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mx: { xs: -2, md: 0 } }}>
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              onMarkRead={(id) => markAsRead.mutate(id)}
            />
          ))}

          {hasNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2, pb: 1 }}>
              <Button
                variant="text"
                disableElevation
                size="small"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2 style={{ height: 16, width: 16, animation: 'spin 1s linear infinite', marginRight: 8 }} />
                ) : null}
                Load more
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default function ActivityPage() {
  // The (app) layout already enforces auth, so an inner AuthGuard here would
  // double-mount the loading gate and flash a blank screen on every load.
  return <ActivityContent />;
}
