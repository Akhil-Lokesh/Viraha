'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { Activity } from '@/lib/types';
import { ActivityItem } from './activity-item';
import { KEEPSAKE, eyebrowSx, fadeUpItem } from './keepsake';

export interface ActivityDayGroupData {
  label: string;
  items: Activity[];
}

/** Day label for grouping ("Today", "Yesterday", "June 3", "June 3, 2025"). */
export function dayLabel(dateStr: string, now: Date = new Date()): string {
  const date = new Date(dateStr);
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' as const }),
  });
}

/** Groups a (descending-by-date) activity list into consecutive day buckets. */
export function groupActivitiesByDay(activities: Activity[]): ActivityDayGroupData[] {
  return activities.reduce<ActivityDayGroupData[]>((groups, activity) => {
    const label = dayLabel(activity.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      return [
        ...groups.slice(0, -1),
        { ...last, items: [...last.items, activity] },
      ];
    }
    return [...groups, { label, items: [activity] }];
  }, []);
}

interface ActivityDayGroupProps {
  group: ActivityDayGroupData;
  onMarkRead: (id: string) => void;
}

// Items use px:2 (16px) and a 28px "sm" avatar, so the avatar column's
// centerline — where the flight path runs — sits 30px from the left edge.
const FLIGHT_PATH_LEFT = 30;

/**
 * One day of the logbook: a Posterama eyebrow date label pinned to a dashed
 * gold flight-path connector that runs down through the entries.
 */
export function ActivityDayGroup({ group, onMarkRead }: ActivityDayGroupProps) {
  return (
    <Box
      component={motion.div}
      variants={fadeUpItem}
      sx={{
        position: 'relative',
        // Dashed gold flight path down the avatar column
        '&::before': {
          content: '""',
          position: 'absolute',
          left: `${FLIGHT_PATH_LEFT}px`,
          top: 6,
          bottom: 12,
          width: 0,
          borderLeft: '1px dashed',
          borderColor: KEEPSAKE.gold,
          opacity: 0.55,
        },
      }}
    >
      {/* Day eyebrow with waypoint marker on the path */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          pl: `${FLIGHT_PATH_LEFT - 4}px`,
          py: 1,
        }}
      >
        <Box
          sx={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            border: '1.5px solid',
            borderColor: KEEPSAKE.gold,
            bgcolor: KEEPSAKE.paper,
            flexShrink: 0,
          }}
        />
        <Typography component="h2" sx={{ ...eyebrowSx, color: KEEPSAKE.gold }}>
          {group.label}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {group.items.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} onMarkRead={onMarkRead} />
        ))}
      </Box>
    </Box>
  );
}
