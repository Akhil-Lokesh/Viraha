'use client';

import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Bell,
  UserPlus,
  MessageCircle,
  Bookmark,
  Reply,
  CheckCheck,
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import { PhotoTile } from '@/components/cinema';
import { CIN, glowRing } from '@/lib/design/cinema-tokens';
import type { Activity } from '@/lib/types';

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

/** Accent unread dot with a soft expanding pulse (still dot when motion is reduced). */
function UnreadDot({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Box
      aria-hidden
      sx={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}
    >
      {!reducedMotion && (
        <Box
          component={motion.span}
          animate={{ scale: [1, 2.4], opacity: [0.5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            borderRadius: '50%',
            bgcolor: CIN.accent,
          }}
        />
      )}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          bgcolor: CIN.accent,
          boxShadow: `0 0 8px ${CIN.accentGlow}`,
        }}
      />
    </Box>
  );
}

interface ActivityItemProps {
  activity: Activity;
  onMarkRead: (id: string) => void;
}

/**
 * A quiet dark list row: actor avatar + type badge, message, relative time,
 * optional post thumbnail, and a pulsing accent dot while unread.
 */
export function ActivityItem({ activity, onMarkRead }: ActivityItemProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const Icon = activityIcons[activity.type] ?? Bell;
  const thumb = activity.post?.mediaThumbnails?.[0] || activity.post?.mediaUrls?.[0];

  return (
    <Box
      component={motion.div}
      whileHover={reducedMotion ? undefined : { x: 2 }}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        px: 2,
        py: 1.5,
        bgcolor: activity.read ? 'transparent' : 'rgba(139,124,255,0.06)',
        borderBottom: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
        transition: 'background-color 0.2s ease',
        cursor: activity.read ? 'default' : 'pointer',
        '&:hover': {
          bgcolor: activity.read
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(139,124,255,0.1)',
        },
      }}
      onClick={() => !activity.read && onMarkRead(activity.id)}
    >
      {/* Actor avatar with activity-type badge */}
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
            bgcolor: 'var(--cin-surface-2, #1C1C24)',
            border: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
            color: CIN.accent,
          }}
        >
          <Icon style={{ height: 9, width: 9 }} />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: 'var(--cin-text, #F4F4F6)' }}>
          <Link
            href={`/profile/${activity.actor?.username}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                color: 'var(--cin-text, #F4F4F6)',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {activity.actor?.displayName || activity.actor?.username}
            </Box>
          </Link>{' '}
          <Box component="span" sx={{ color: 'var(--cin-text-muted, #9A9AA6)' }}>
            {activityMessage(activity)}
          </Box>
        </Typography>
        {activity.comment && (
          <Typography
            variant="body2"
            sx={{
              color: 'var(--cin-text-muted, #9A9AA6)',
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
        {/* Relative time depends on Date.now() — SSR and client can disagree. */}
        <Typography
          variant="caption"
          suppressHydrationWarning
          sx={{
            color: 'var(--cin-text-muted, #9A9AA6)',
            opacity: 0.8,
            mt: 0.5,
            display: 'block',
          }}
        >
          {timeAgo(activity.createdAt)}
        </Typography>
      </Box>

      {/* Post thumbnail */}
      {thumb && activity.postId && (
        <Link
          href={`/post/${activity.postId}`}
          aria-label="View post"
          style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
        >
          <Box
            component={motion.div}
            whileHover={reducedMotion ? undefined : { scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            sx={{
              borderRadius: '8px',
              '&:hover': { boxShadow: glowRing(1) },
              transition: 'box-shadow 0.2s ease',
            }}
          >
            <PhotoTile
              src={thumb}
              alt="View post"
              vignette={false}
              rounded={8}
              sx={{ width: 44, height: 44 }}
            />
          </Box>
        </Link>
      )}

      {/* Unread indicator — pulsing accent dot */}
      {!activity.read && (
        <Box sx={{ flexShrink: 0, mt: 1 }}>
          <UnreadDot reducedMotion={reducedMotion} />
        </Box>
      )}
    </Box>
  );
}
