'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import type { WidgetInstance, WidgetType, WidgetGridSize } from '@/lib/types/dashboard';
import { WIDGET_COMPONENTS } from './widgets';
import { getJournalTokens, eyebrowSx, spreadItem } from './journal-tokens';

/**
 * View-mode "journal spread" layout: a wide main column of large, photographic
 * widgets and a narrow margin column of field notes. Replaces the uniform
 * 4-column grid in view mode; edit mode keeps the original draggable grid.
 *
 * Consolidations (data still reachable):
 * - stats_countries / stats_cities are folded into the StampStrip (same
 *   useAtlas data), so they are not repeated here.
 */

const CONSOLIDATED_TYPES: ReadonlySet<WidgetType> = new Set<WidgetType>([
  'stats_countries',
  'stats_cities',
]);

const MARGIN_TYPES: ReadonlySet<WidgetType> = new Set<WidgetType>([
  'quote',
  'continent_progress',
  'want_to_go',
  'travel_style',
  'kindred_travelers',
  'streak',
  'next_capsule',
  'dream_count',
]);

interface SpreadSlot {
  size: WidgetGridSize;
  height: number;
}

function getMainSlot(type: WidgetType): SpreadSlot {
  if (type === 'album_carousel') return { size: { cols: 4, rows: 1 }, height: 176 };
  return { size: { cols: 4, rows: 2 }, height: 336 };
}

function getMarginSlot(type: WidgetType): SpreadSlot {
  if (type === 'streak' || type === 'next_capsule' || type === 'dream_count') {
    return { size: { cols: 2, rows: 1 }, height: 120 };
  }
  if (type === 'quote' || type === 'continent_progress') {
    return { size: { cols: 2, rows: 1 }, height: 150 };
  }
  return { size: { cols: 2, rows: 2 }, height: 280 };
}

function byGridPosition(a: WidgetInstance, b: WidgetInstance): number {
  return a.position.row - b.position.row || a.position.col - b.position.col;
}

const JOURNAL_DEFAULT_COLOR = '#D4A843';

interface EditorialSpreadProps {
  widgets: WidgetInstance[];
}

export function EditorialSpread({ widgets }: EditorialSpreadProps) {
  const theme = useTheme();
  const t = getJournalTokens(theme.palette.mode === 'dark' ? 'dark' : 'light');

  const visible = widgets.filter((w) => !CONSOLIDATED_TYPES.has(w.type));
  const mainWidgets = visible.filter((w) => !MARGIN_TYPES.has(w.type)).sort(byGridPosition);
  const marginWidgets = visible.filter((w) => MARGIN_TYPES.has(w.type)).sort(byGridPosition);

  if (mainWidgets.length === 0 && marginWidgets.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 312px' },
        gap: { xs: 4, lg: 5 },
        alignItems: 'start',
      }}
    >
      {/* Main column — the spread's large pages */}
      {mainWidgets.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <motion.div variants={spreadItem}>
            <Typography component="p" sx={{ ...eyebrowSx, color: t.inkSoft }}>
              Recent pages
            </Typography>
          </motion.div>
          {mainWidgets.map((widget) => {
            const slot = getMainSlot(widget.type);
            const Component = WIDGET_COMPONENTS[widget.type];
            return (
              <motion.div key={widget.id} variants={spreadItem}>
                <Box sx={{ height: slot.height }}>
                  <Component size={slot.size} color={widget.color ?? JOURNAL_DEFAULT_COLOR} albumId={widget.albumId} />
                </Box>
              </motion.div>
            );
          })}
        </Box>
      )}

      {/* Margin column — field notes with a flight-path connector */}
      {marginWidgets.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            minWidth: 0,
            pl: { xs: 0, lg: 3 },
            borderLeft: { xs: 'none', lg: '1px dashed' },
            borderLeftColor: { lg: t.goldHairline },
          }}
        >
          <motion.div variants={spreadItem}>
            <Typography component="p" sx={{ ...eyebrowSx, color: t.inkSoft }}>
              Field notes
            </Typography>
          </motion.div>
          {marginWidgets.map((widget) => {
            const slot = getMarginSlot(widget.type);
            const Component = WIDGET_COMPONENTS[widget.type];
            return (
              <motion.div key={widget.id} variants={spreadItem}>
                <Box sx={{ height: slot.height }}>
                  <Component size={slot.size} color={widget.color ?? JOURNAL_DEFAULT_COLOR} albumId={widget.albumId} />
                </Box>
              </motion.div>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
