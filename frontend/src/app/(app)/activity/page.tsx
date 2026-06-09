'use client';

import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import {
  useActivities,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/lib/hooks/use-activities';
import { useActivityStream } from '@/lib/hooks/use-activity-stream';
import { FollowRequestsSection } from '@/components/activity/follow-requests';
import {
  ActivityDayGroup,
  groupActivitiesByDay,
} from '@/components/activity/activity-day-group';
import {
  KEEPSAKE,
  eyebrowSx,
  staggerContainer,
  fadeUpItem,
} from '@/components/activity/keepsake';

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
  // above and are excluded server-side from this generic stream, so a pending
  // request shows exactly once (in the actionable section), not here.
  const activities = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const dayGroups = useMemo(() => groupActivitiesByDay(activities), [activities]);

  return (
    <Box
      component={motion.div}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      sx={{ maxWidth: 672, mx: 'auto' }}
    >
      {/* Page heading — journal title spread */}
      <Box
        component={motion.div}
        variants={fadeUpItem}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          mb: 3,
          pb: 2,
          borderBottom: '1px dashed',
          borderColor: KEEPSAKE.hairline,
        }}
      >
        <Box>
          <Typography sx={{ ...eyebrowSx, color: KEEPSAKE.gold, mb: 0.5 }}>
            Travel log
          </Typography>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: 'var(--font-accent)',
              color: 'text.primary',
              lineHeight: 1.1,
            }}
          >
            Activity
          </Typography>
          {unreadCount > 0 && (
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: KEEPSAKE.gold,
                  mr: 0.75,
                }}
              />
              {unreadCount} unread
            </Typography>
          )}
        </Box>

        {unreadCount > 0 && (
          <Button
            variant="text"
            disableElevation
            size="small"
            sx={{
              gap: 0.75,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: KEEPSAKE.gold,
              flexShrink: 0,
            }}
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck style={{ height: 14, width: 14 }} />
            Mark all read
          </Button>
        )}
      </Box>

      {/* Pending follow requests (private accounts) — passport stamps */}
      <FollowRequestsSection />

      {/* Activity logbook */}
      {isLoading ? (
        <Box
          component={motion.div}
          variants={fadeUpItem}
          sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
              <Skeleton
                variant="rounded"
                animation="pulse"
                sx={{ height: 36, width: 36, borderRadius: '50%' }}
              />
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 16, width: '75%' }} />
                <Skeleton variant="rounded" animation="pulse" sx={{ height: 12, width: '25%' }} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : activities.length === 0 ? (
        <Box
          component={motion.div}
          variants={fadeUpItem}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 10,
            textAlign: 'center',
          }}
        >
          {/* Empty-stamp motif */}
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: '4px',
              border: '1.5px dashed',
              borderColor: KEEPSAKE.gold,
              transform: 'rotate(-2deg)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              mb: 2.5,
            }}
          >
            <Bell style={{ width: 24, height: 24, color: 'var(--viraha-gold, #D4A843)' }} />
            <Typography sx={{ ...eyebrowSx, fontSize: '9px', color: KEEPSAKE.gold }}>
              No stamps
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{ fontFamily: 'var(--font-accent)', mb: 0.5, color: 'text.primary' }}
          >
            No activity yet
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 320 }}>
            When someone follows you, comments on your posts, or saves your memories,
            you&apos;ll see it here.
          </Typography>
        </Box>
      ) : (
        <Box
          component={motion.div}
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mx: { xs: -2, md: 0 } }}
        >
          {dayGroups.map((group) => (
            <ActivityDayGroup
              key={group.label}
              group={group}
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
                sx={{ color: KEEPSAKE.gold }}
              >
                {isFetchingNextPage ? (
                  <Loader2
                    style={{
                      height: 16,
                      width: 16,
                      animation: 'spin 1s linear infinite',
                      marginRight: 8,
                    }}
                  />
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
  // Real-time SSE subscription: keeps activities + unread count fresh while
  // this page is open. The hook is a refcounted singleton, so the (app)
  // layout can additionally adopt useActivityStream() later for app-wide
  // real-time badges without double-connecting.
  useActivityStream();

  // The (app) layout already enforces auth, so an inner AuthGuard here would
  // double-mount the loading gate and flash a blank screen on every load.
  return <ActivityContent />;
}
