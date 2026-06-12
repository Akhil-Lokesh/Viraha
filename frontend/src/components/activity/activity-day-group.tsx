'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { eyebrowSx } from '@/lib/design/cinema-tokens';
import { staggerItem } from '@/lib/animations';
import type { Activity } from '@/lib/types';
import { ActivityItem } from './activity-item';

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

/**
 * One day of the stream: a muted uppercase eyebrow date label above a quiet
 * dark list of rows separated by hairlines.
 */
export function ActivityDayGroup({ group, onMarkRead }: ActivityDayGroupProps) {
  return (
    <Box component={motion.div} variants={staggerItem}>
      {/* Day labels are locale/now-dependent — SSR and client can disagree. */}
      <Typography
        component="h2"
        suppressHydrationWarning
        sx={{ ...eyebrowSx, px: 2, py: 1 }}
      >
        {group.label}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          borderTop: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))',
        }}
      >
        {group.items.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} onMarkRead={onMarkRead} />
        ))}
      </Box>
    </Box>
  );
}
