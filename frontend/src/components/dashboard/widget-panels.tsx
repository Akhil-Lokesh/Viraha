'use client';

import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import type { WidgetInstance, WidgetType, WidgetGridSize } from '@/lib/types/dashboard';
import { WIDGET_COMPONENTS } from './widgets';
import { CinemaCard, SectionLabel } from '@/components/cinema';
import { CIN } from '@/lib/design/cinema-tokens';
import { staggerItem } from '@/lib/animations';

/**
 * View-mode layout: a wide main column of large photographic widgets and a
 * narrow rail of compact at-a-glance cards, all on CinemaCard surfaces.
 * Edit mode keeps the original draggable grid.
 *
 * Consolidations (data still reachable):
 * - stats_countries / stats_cities are folded into the StatsStrip (same
 *   useAtlas data), so they are not repeated here.
 */

const CONSOLIDATED_TYPES: ReadonlySet<WidgetType> = new Set<WidgetType>([
  'stats_countries',
  'stats_cities',
]);

const RAIL_TYPES: ReadonlySet<WidgetType> = new Set<WidgetType>([
  'quote',
  'continent_progress',
  'want_to_go',
  'travel_style',
  'kindred_travelers',
  'streak',
  'next_capsule',
  'dream_count',
]);

interface PanelSlot {
  size: WidgetGridSize;
  height: number;
}

function getMainSlot(type: WidgetType): PanelSlot {
  if (type === 'album_carousel') return { size: { cols: 4, rows: 1 }, height: 176 };
  return { size: { cols: 4, rows: 2 }, height: 336 };
}

function getRailSlot(type: WidgetType): PanelSlot {
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

const PANEL_DEFAULT_COLOR = CIN.accent;

interface WidgetPanelsProps {
  widgets: WidgetInstance[];
}

export function WidgetPanels({ widgets }: WidgetPanelsProps) {
  const visible = widgets.filter((w) => !CONSOLIDATED_TYPES.has(w.type));
  const mainWidgets = visible.filter((w) => !RAIL_TYPES.has(w.type)).sort(byGridPosition);
  const railWidgets = visible.filter((w) => RAIL_TYPES.has(w.type)).sort(byGridPosition);

  if (mainWidgets.length === 0 && railWidgets.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 312px' },
        gap: { xs: 4, lg: 5 },
        alignItems: 'start',
      }}
    >
      {/* Main column — large photographic panels */}
      {mainWidgets.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <motion.div variants={staggerItem}>
            <SectionLabel>Collections</SectionLabel>
          </motion.div>
          {mainWidgets.map((widget) => {
            const slot = getMainSlot(widget.type);
            const Component = WIDGET_COMPONENTS[widget.type];
            return (
              <motion.div key={widget.id} variants={staggerItem}>
                <Box sx={{ height: slot.height }}>
                  <CinemaCard sx={{ height: '100%' }}>
                    <Component size={slot.size} color={widget.color ?? PANEL_DEFAULT_COLOR} albumId={widget.albumId} />
                  </CinemaCard>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      )}

      {/* Rail — compact at-a-glance cards behind a hairline divider */}
      {railWidgets.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            minWidth: 0,
            pl: { xs: 0, lg: 3 },
            borderLeft: { xs: 'none', lg: '1px solid var(--cin-hairline, rgba(255,255,255,0.08))' },
          }}
        >
          <motion.div variants={staggerItem}>
            <SectionLabel>At a glance</SectionLabel>
          </motion.div>
          {railWidgets.map((widget) => {
            const slot = getRailSlot(widget.type);
            const Component = WIDGET_COMPONENTS[widget.type];
            return (
              <motion.div key={widget.id} variants={staggerItem}>
                <Box sx={{ height: slot.height }}>
                  <CinemaCard sx={{ height: '100%' }}>
                    <Component size={slot.size} color={widget.color ?? PANEL_DEFAULT_COLOR} albumId={widget.albumId} />
                  </CinemaCard>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
