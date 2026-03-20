export type WidgetType =
  | 'stats_countries'
  | 'stats_cities'
  | 'on_this_day'
  | 'album_preview'
  | 'quote'
  | 'journal_highlight'
  | 'timeline'
  | 'continent_progress'
  | 'album_carousel'
  | 'photo_mosaic'
  | 'mini_map'
  | 'viraha_moment';

/** Grid span in cell units — only whole-number multiples (1, 2, 4) */
export interface WidgetGridSize {
  cols: 1 | 2 | 4;
  rows: 1 | 2 | 4;
}

/** Explicit grid position (1-indexed) */
export interface GridPosition {
  col: number;
  row: number;
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  position: GridPosition;
  gridSize?: WidgetGridSize; // Override — if absent, uses registry default
  color?: string; // hex color, e.g. '#7B68EE'
  albumId?: string; // For album-type widgets — which album to display
}

export interface WidgetMeta {
  type: WidgetType;
  label: string;
  gridSize: WidgetGridSize;
  allowedSizes: WidgetGridSize[];
  maxInstances: number;
}

export interface DashboardLayout {
  widgets: WidgetInstance[];
}
