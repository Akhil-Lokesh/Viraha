import type { WidgetMeta, WidgetType, WidgetInstance, GridPosition, WidgetGridSize } from '../types/dashboard';

export const WIDGET_COLORS = [
  { name: 'Purple',  hex: '#7B68EE' },
  { name: 'Ocean',   hex: '#2563EB' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Sunset',  hex: '#EA580C' },
  { name: 'Rose',    hex: '#E11D48' },
  { name: 'Gold',    hex: '#D4A843' },
  { name: 'Slate',   hex: '#475569' },
  { name: 'Teal',    hex: '#0D9488' },
];

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMeta> = {
  stats_countries: {
    type: 'stats_countries', label: 'Countries Visited',
    gridSize: { cols: 1, rows: 1 },
    allowedSizes: [{ cols: 1, rows: 1 }, { cols: 2, rows: 1 }],
    maxInstances: Infinity,
  },
  stats_cities: {
    type: 'stats_cities', label: 'Cities Explored',
    gridSize: { cols: 1, rows: 1 },
    allowedSizes: [{ cols: 1, rows: 1 }, { cols: 2, rows: 1 }],
    maxInstances: Infinity,
  },
  on_this_day: {
    type: 'on_this_day', label: 'On This Day',
    gridSize: { cols: 2, rows: 2 },
    allowedSizes: [{ cols: 2, rows: 2 }, { cols: 4, rows: 2 }],
    maxInstances: Infinity,
  },
  album_preview: {
    type: 'album_preview', label: 'Featured Album',
    gridSize: { cols: 2, rows: 2 },
    allowedSizes: [{ cols: 2, rows: 2 }, { cols: 4, rows: 2 }, { cols: 4, rows: 4 }],
    maxInstances: Infinity,
  },
  quote: {
    type: 'quote', label: 'Travel Quote',
    gridSize: { cols: 2, rows: 1 },
    allowedSizes: [{ cols: 1, rows: 1 }, { cols: 2, rows: 1 }, { cols: 4, rows: 1 }],
    maxInstances: Infinity,
  },
  journal_highlight: {
    type: 'journal_highlight', label: 'Journal Highlight',
    gridSize: { cols: 2, rows: 2 },
    allowedSizes: [{ cols: 2, rows: 2 }, { cols: 4, rows: 2 }],
    maxInstances: Infinity,
  },
  timeline: {
    type: 'timeline', label: 'Timeline',
    gridSize: { cols: 4, rows: 2 },
    allowedSizes: [{ cols: 2, rows: 2 }, { cols: 2, rows: 4 }, { cols: 4, rows: 2 }, { cols: 4, rows: 4 }],
    maxInstances: Infinity,
  },
  continent_progress: {
    type: 'continent_progress', label: 'Continent Progress',
    gridSize: { cols: 2, rows: 1 },
    allowedSizes: [{ cols: 2, rows: 1 }, { cols: 4, rows: 1 }, { cols: 4, rows: 2 }],
    maxInstances: Infinity,
  },
  album_carousel: {
    type: 'album_carousel', label: 'Album Carousel',
    gridSize: { cols: 4, rows: 1 },
    allowedSizes: [{ cols: 4, rows: 1 }, { cols: 4, rows: 2 }],
    maxInstances: Infinity,
  },
  photo_mosaic: {
    type: 'photo_mosaic', label: 'Photo Mosaic',
    gridSize: { cols: 2, rows: 2 },
    allowedSizes: [{ cols: 2, rows: 2 }, { cols: 4, rows: 2 }, { cols: 4, rows: 4 }],
    maxInstances: Infinity,
  },
  mini_map: {
    type: 'mini_map', label: 'Mini Map',
    gridSize: { cols: 2, rows: 2 },
    allowedSizes: [{ cols: 2, rows: 2 }, { cols: 4, rows: 2 }, { cols: 4, rows: 4 }],
    maxInstances: Infinity,
  },
  viraha_moment: {
    type: 'viraha_moment', label: 'Viraha Moments',
    gridSize: { cols: 2, rows: 2 },
    allowedSizes: [{ cols: 2, rows: 2 }, { cols: 4, rows: 2 }, { cols: 4, rows: 4 }],
    maxInstances: 1,
  },
};

// ── Helpers ──────────────────────────────────────────────

/** Single source of truth for a widget's current size */
export function getEffectiveSize(widget: WidgetInstance): WidgetGridSize {
  return widget.gridSize ?? WIDGET_REGISTRY[widget.type].gridSize;
}

export function formatGridSize(cols: number, rows: number): string {
  return `${cols}×${rows}`;
}

const SIZE_LABELS: Record<string, string> = {
  '1,1': 'Small',
  '1,2': 'Tall',
  '2,1': 'Wide',
  '2,2': 'Medium',
  '2,4': 'Vertical',
  '4,1': 'Banner',
  '4,2': 'Large',
  '4,4': 'Full',
};

export function getSizeLabel(size: WidgetGridSize): string {
  return SIZE_LABELS[`${size.cols},${size.rows}`] ?? formatGridSize(size.cols, size.rows);
}

let counter = 0;
export function createWidgetInstance(type: WidgetType, position: GridPosition, color?: string, albumId?: string): WidgetInstance {
  counter += 1;
  return { id: `${type}-${Date.now()}-${counter}`, type, position, ...(color && { color }), ...(albumId && { albumId }) };
}

// ── Overlap / bounds ────────────────────────────────────

const NUM_COLS = 4;

export function isInBounds(
  pos: GridPosition,
  size: { cols: number; rows: number },
): boolean {
  return pos.col >= 1 && pos.col + size.cols - 1 <= NUM_COLS && pos.row >= 1;
}

export function hasOverlap(
  pos: GridPosition,
  size: { cols: number; rows: number },
  widgets: WidgetInstance[],
  excludeId?: string,
): boolean {
  return widgets.some((w) => {
    if (w.id === excludeId) return false;
    const ws = getEffectiveSize(w);
    return (
      pos.col < w.position.col + ws.cols &&
      pos.col + size.cols > w.position.col &&
      pos.row < w.position.row + ws.rows &&
      pos.row + size.rows > w.position.row
    );
  });
}

export function findFirstAvailable(
  size: { cols: number; rows: number },
  widgets: WidgetInstance[],
): GridPosition {
  for (let row = 1; row <= 50; row++) {
    for (let col = 1; col <= NUM_COLS - size.cols + 1; col++) {
      if (!hasOverlap({ col, row }, size, widgets)) {
        return { col, row };
      }
    }
  }
  return { col: 1, row: 1 };
}

// ── Default scrapbook layout ────────────────────────────

export const DEFAULT_WIDGETS: WidgetInstance[] = [
  { id: 'default-album_preview',      type: 'album_preview',      position: { col: 1, row: 1 }, color: '#7B68EE' },
  { id: 'default-on_this_day',        type: 'on_this_day',        position: { col: 3, row: 1 }, color: '#2563EB' },
  { id: 'default-stats_countries',    type: 'stats_countries',    position: { col: 1, row: 3 }, color: '#059669' },
  { id: 'default-stats_cities',       type: 'stats_cities',       position: { col: 2, row: 3 }, color: '#EA580C' },
  { id: 'default-continent_progress', type: 'continent_progress', position: { col: 3, row: 3 }, color: '#D4A843' },
  { id: 'default-timeline',           type: 'timeline',           position: { col: 1, row: 4 }, color: '#E11D48' },
  { id: 'default-journal_highlight',  type: 'journal_highlight',  position: { col: 1, row: 6 }, color: '#0D9488' },
  { id: 'default-photo_mosaic',       type: 'photo_mosaic',       position: { col: 3, row: 6 }, color: '#475569' },
  { id: 'default-quote',              type: 'quote',              position: { col: 1, row: 8 }, color: '#7B68EE' },
  { id: 'default-mini_map',           type: 'mini_map',           position: { col: 3, row: 8 }, color: '#2563EB' },
  { id: 'default-album_carousel',     type: 'album_carousel',     position: { col: 1, row: 10 }, color: '#059669' },
];
