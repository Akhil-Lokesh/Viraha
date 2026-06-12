'use client';

import { useMemo } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import { CheckCheck, Loader2 } from 'lucide-react';
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
import { EmptyState } from '@/components/shared/empty-state';
import { GlowButton } from '@/components/cinema';
import { CIN, eyebrowSx, displaySx } from '@/lib/design/cinema-tokens';
import { staggerContainer, staggerItem } from '@/lib/animations';

const SKELETON_SX = { bgcolor: 'var(--cin-surface-2, #1C1C24)' } as const;

function ActivitySkeleton() {
  return (
    <Box
      component={motion.div}
      variants={staggerItem}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
          <Skeleton
            variant="rounded"
            animation="pulse"
            sx={{ ...SKELETON_SX, height: 36, width: 36, borderRadius: '50%' }}
          />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Skeleton variant="rounded" animation="pulse" sx={{ ...SKELETON_SX, height: 16, width: '75%' }} />
            <Skeleton variant="rounded" animation="pulse" sx={{ ...SKELETON_SX, height: 12, width: '25%' }} />
          </Box>
        </Box>
      ))}
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
      sx={{ maxWidth: 672, mx: 'auto', pb: 8 }}
    >
      {/* Page heading */}
      <Box component={motion.div} variants={staggerItem} sx={{ pt: { xs: 2, md: 4 }, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ ...eyebrowSx, mb: 1 }}>What&apos;s new</Typography>
            <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: 36, md: 48 } }}>
              Activity
            </Typography>
            {unreadCount > 0 && (
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--cin-text-muted, #9A9AA6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  mt: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: CIN.accent,
                    boxShadow: `0 0 8px ${CIN.accentGlow}`,
                    flexShrink: 0,
                  }}
                />
                {unreadCount} unread
              </Typography>
            )}
          </Box>

          {unreadCount > 0 && (
            <GlowButton
              variant="ghost"
              size="small"
              sx={{ gap: 0.75, px: 1.75, py: 0.5, fontSize: '0.78rem', flexShrink: 0 }}
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck style={{ height: 14, width: 14 }} />
              Mark all read
            </GlowButton>
          )}
        </Box>
        <Box
          sx={{
            mt: 3,
            borderTop: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
          }}
        />
      </Box>

      {/* Pending follow requests (private accounts) */}
      <FollowRequestsSection />

      {/* Activity stream. The list mounts AFTER the page container's entrance
          animation has finished (data arrives async), so it must own its
          initial/animate rather than inherit from the already-settled parent —
          otherwise the rows stay stuck at the hidden variant (opacity 0). */}
      {isLoading ? (
        <ActivitySkeleton />
      ) : activities.length === 0 ? (
        <Box component={motion.div} initial="hidden" animate="visible" variants={staggerItem}>
          <EmptyState
            icon="compass"
            title="No activity yet"
            description="When someone follows you, comments on your posts, or saves your memories, you'll see it here."
          />
        </Box>
      ) : (
        <Box
          component={motion.div}
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mx: { xs: -2, md: 0 } }}
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
              <GlowButton
                variant="ghost"
                size="small"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
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
              </GlowButton>
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
