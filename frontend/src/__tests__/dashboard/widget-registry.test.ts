import { describe, it, expect } from 'vitest';
import {
  WIDGET_REGISTRY,
  WIDGET_COLORS,
  DEFAULT_WIDGETS,
  getEffectiveSize,
  formatGridSize,
  getSizeLabel,
  isInBounds,
  hasOverlap,
  findFirstAvailable,
  createWidgetInstance,
} from '../../lib/dashboard/widget-registry';
import type { WidgetInstance } from '../../lib/types/dashboard';

describe('Widget Registry', () => {
  it('should have all widget types defined', () => {
    const types = Object.keys(WIDGET_REGISTRY);
    expect(types).toContain('stats_countries');
    expect(types).toContain('mini_map');
    expect(types).toContain('timeline');
    expect(types).toContain('quote');
    expect(types.length).toBeGreaterThanOrEqual(10);
  });

  it('should have 8 widget colors', () => {
    expect(WIDGET_COLORS).toHaveLength(8);
    WIDGET_COLORS.forEach((c) => {
      expect(c.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should have default widgets', () => {
    expect(DEFAULT_WIDGETS.length).toBeGreaterThan(0);
    DEFAULT_WIDGETS.forEach((w) => {
      expect(WIDGET_REGISTRY[w.type]).toBeDefined();
      expect(w.position.col).toBeGreaterThanOrEqual(1);
      expect(w.position.row).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('getEffectiveSize', () => {
  it('should return widget gridSize if set', () => {
    const widget: WidgetInstance = {
      id: 'test', type: 'quote', position: { col: 1, row: 1 },
      gridSize: { cols: 4, rows: 1 },
    };
    expect(getEffectiveSize(widget)).toEqual({ cols: 4, rows: 1 });
  });

  it('should fall back to registry default when no gridSize', () => {
    const widget: WidgetInstance = {
      id: 'test', type: 'stats_countries', position: { col: 1, row: 1 },
    };
    expect(getEffectiveSize(widget)).toEqual({ cols: 1, rows: 1 });
  });
});

describe('formatGridSize', () => {
  it('should format as cols×rows', () => {
    expect(formatGridSize(2, 2)).toBe('2×2');
    expect(formatGridSize(4, 1)).toBe('4×1');
  });
});

describe('getSizeLabel', () => {
  it('should return human-readable labels', () => {
    expect(getSizeLabel({ cols: 1, rows: 1 })).toBe('Small');
    expect(getSizeLabel({ cols: 2, rows: 2 })).toBe('Medium');
    expect(getSizeLabel({ cols: 4, rows: 2 })).toBe('Large');
    expect(getSizeLabel({ cols: 4, rows: 4 })).toBe('Full');
  });

  it('should fall back to formatted size for unknown combos', () => {
    expect(getSizeLabel({ cols: 3, rows: 3 })).toBe('3×3');
  });
});

describe('isInBounds', () => {
  it('should accept positions within 4-column grid', () => {
    expect(isInBounds({ col: 1, row: 1 }, { cols: 1, rows: 1 })).toBe(true);
    expect(isInBounds({ col: 1, row: 1 }, { cols: 4, rows: 2 })).toBe(true);
    expect(isInBounds({ col: 3, row: 5 }, { cols: 2, rows: 1 })).toBe(true);
  });

  it('should reject positions outside grid', () => {
    expect(isInBounds({ col: 0, row: 1 }, { cols: 1, rows: 1 })).toBe(false);
    expect(isInBounds({ col: 4, row: 1 }, { cols: 2, rows: 1 })).toBe(false);
    expect(isInBounds({ col: 5, row: 1 }, { cols: 1, rows: 1 })).toBe(false);
  });
});

describe('hasOverlap', () => {
  const widgets: WidgetInstance[] = [
    { id: 'a', type: 'stats_countries', position: { col: 1, row: 1 } },
  ];

  it('should detect overlap', () => {
    expect(hasOverlap({ col: 1, row: 1 }, { cols: 1, rows: 1 }, widgets)).toBe(true);
  });

  it('should not detect overlap when no conflict', () => {
    expect(hasOverlap({ col: 2, row: 1 }, { cols: 1, rows: 1 }, widgets)).toBe(false);
  });

  it('should exclude a widget by id', () => {
    expect(hasOverlap({ col: 1, row: 1 }, { cols: 1, rows: 1 }, widgets, 'a')).toBe(false);
  });
});

describe('findFirstAvailable', () => {
  it('should find first open position', () => {
    const widgets: WidgetInstance[] = [
      { id: 'a', type: 'stats_countries', position: { col: 1, row: 1 } },
    ];
    const pos = findFirstAvailable({ cols: 1, rows: 1 }, widgets);
    expect(pos.col).toBe(2);
    expect(pos.row).toBe(1);
  });

  it('should return (1,1) for empty grid', () => {
    const pos = findFirstAvailable({ cols: 2, rows: 2 }, []);
    expect(pos).toEqual({ col: 1, row: 1 });
  });
});

describe('createWidgetInstance', () => {
  it('should create a widget with id, type, and position', () => {
    const widget = createWidgetInstance('quote', { col: 1, row: 1 });
    expect(widget.id).toContain('quote');
    expect(widget.type).toBe('quote');
    expect(widget.position).toEqual({ col: 1, row: 1 });
  });

  it('should include color when provided', () => {
    const widget = createWidgetInstance('quote', { col: 1, row: 1 }, '#FF0000');
    expect(widget.color).toBe('#FF0000');
  });

  it('should include albumId when provided', () => {
    const widget = createWidgetInstance('album_preview', { col: 1, row: 1 }, undefined, 'album-123');
    expect(widget.albumId).toBe('album-123');
  });
});
