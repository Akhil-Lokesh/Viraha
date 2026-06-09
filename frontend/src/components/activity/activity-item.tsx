'use client';

import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import {
  Bell,
  UserPlus,
  MessageCircle,
  Bookmark,
  Reply,
  CheckCheck,
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import type { Activity } from '@/lib/types';
import { KEEPSAKE, fadeUpItem } from './keepsake';

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

interface ActivityItemProps {
  activity: Activity;
  onMarkRead: (id: string) => void;
}

/**
 * A single logbook entry. Sits on the flight-path connector rendered by the
 * day group; the avatar acts as the waypoint node on the dashed gold line.
 */
export function ActivityItem({ activity, onMarkRead }: ActivityItemProps) {
  const Icon = activityIcons[activity.type] ?? Bell;
  const thumb = activity.post?.mediaThumbnails?.[0] || activity.post?.mediaUrls?.[0];

  return (
    <Box
      component={motion.div}
      variants={fadeUpItem}
      sx={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        px: 2,
        py: 1.5,
        bgcolor: !activity.read ? KEEPSAKE.goldSoft : 'transparent',
        borderBottom: '1px dashed',
        borderColor: KEEPSAKE.hairline,
        transition: 'background-color 0.2s',
        cursor: !activity.read ? 'pointer' : 'default',
        ...(activity.read && { '&:hover': { bgcolor: 'action.hover' } }),
      }}
      onClick={() => !activity.read && onMarkRead(activity.id)}
    >
      {/* Actor avatar — waypoint node on the flight path */}
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
            bottom: -5,
            right: -5,
            width: 18,
            height: 18,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: KEEPSAKE.paper,
            border: '1px solid',
            borderColor: KEEPSAKE.gold,
            color: KEEPSAKE.gold,
          }}
        >
          <Icon style={{ height: 9, width: 9 }} />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2">
          <Link
            href={`/profile/${activity.actor?.username}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {activity.actor?.displayName || activity.actor?.username}
            </Box>
          </Link>{' '}
          <Box component="span" sx={{ color: 'text.secondary' }}>
            {activityMessage(activity)}
          </Box>
        </Typography>
        {activity.comment && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
              mt: 0.25,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            &ldquo;{activity.comment.text}&rdquo;
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', opacity: 0.7, mt: 0.5, display: 'block' }}
        >
          {timeAgo(activity.createdAt)}
        </Typography>
      </Box>

      {/* Post thumbnail — tiny polaroid */}
      {thumb && activity.postId && (
        <Link
          href={`/post/${activity.postId}`}
          aria-label="View post"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Box sx={{ flexShrink: 0, transform: 'rotate(1.5deg)' }}>
            <Box
              sx={{
                width: 44,
                height: 48,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: KEEPSAKE.hairline,
                bgcolor: KEEPSAKE.paper,
                p: '3px',
                pb: '7px',
                boxShadow: '2px 2px 0 rgba(34, 28, 24, 0.12)',
              }}
            >
              <img
                src={resolveImageUrl(thumb)}
                alt="View post"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </Box>
        </Link>
      )}

      {/* Unread indicator — gold dot */}
      {!activity.read && (
        <Box sx={{ flexShrink: 0, mt: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: KEEPSAKE.gold,
            }}
          />
        </Box>
      )}
    </Box>
  );
}
