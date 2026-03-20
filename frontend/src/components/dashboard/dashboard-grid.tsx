'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { WidgetInstance, GridPosition, WidgetGridSize } from '@/lib/types/dashboard';
import { WIDGET_REGISTRY, getEffectiveSize, isInBounds, getSizeLabel } from '@/lib/dashboard/widget-registry';
import { WIDGET_COMPONENTS } from './widgets';
import { WidgetWrapper } from './widget-wrapper';

const ROW_HEIGHT = 160;
const GAP = 16;

interface DashboardGridProps {
  widgets: WidgetInstance[];
  isEditMode: boolean;
  onMove: (id: string, position: GridPosition) => void;
  onResize: (id: string, newSize: WidgetGridSize) => boolean;
  onRemove: (id: string) => void;
  onChangeColor?: (id: string, color: string) => void;
}

export function DashboardGrid({ widgets, isEditMode, onMove, onResize, onRemove, onChangeColor }: DashboardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellWidth, setCellWidth] = useState(200);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<GridPosition | null>(null);

  // Resize drag state
  const [resizeDrag, setResizeDrag] = useState<{
    widgetId: string;
    ghostSize: WidgetGridSize;
  } | null>(null);

  // Refs to avoid stale closures
  const ghostPosRef = useRef<GridPosition | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const widgetsRef = useRef(widgets);
  const cellWidthRef = useRef(cellWidth);
  const moveCleanupRef = useRef<(() => void) | null>(null);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const resizeGhostRef = useRef<{ widgetId: string; ghostSize: WidgetGridSize } | null>(null);
  widgetsRef.current = widgets;
  cellWidthRef.current = cellWidth;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = (entry.contentRect.width - 3 * GAP) / 4;
      setCellWidth(w);
      cellWidthRef.current = w;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Move drag ──────────────────────────────────────────
  // Uses raw pointer position relative to grid (not event.delta)
  // for reliable ghost positioning.

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    activeIdRef.current = id;
    setActiveId(id);

    const gridEl = gridRef.current;
    if (!gridEl) return;

    const onPointerMove = (e: PointerEvent) => {
      const widget = widgetsRef.current.find((w) => w.id === id);
      if (!widget) return;

      const gridRect = gridEl.getBoundingClientRect();
      const cw = cellWidthRef.current;
      const size = getEffectiveSize(widget);

      // Pointer position relative to grid element (handles scroll)
      const relX = e.clientX - gridRect.left;
      const relY = e.clientY - gridRect.top;

      // Convert to 1-based grid coordinates, clamp to keep widget in bounds
      let col = Math.floor(relX / (cw + GAP)) + 1;
      let row = Math.floor(relY / (ROW_HEIGHT + GAP)) + 1;
      col = Math.max(1, Math.min(col, 4 - size.cols + 1));
      row = Math.max(1, row);

      const newPos = { col, row };

      // Only update state when position actually changed
      const prev = ghostPosRef.current;
      if (!prev || prev.col !== newPos.col || prev.row !== newPos.row) {
        ghostPosRef.current = newPos;
        setGhostPos(newPos);
      }
    };

    document.addEventListener('pointermove', onPointerMove);
    moveCleanupRef.current = () => {
      document.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      moveCleanupRef.current?.();
      moveCleanupRef.current = null;

      const finalPos = ghostPosRef.current;
      const id = activeIdRef.current;
      if (finalPos && id) {
        const widget = widgetsRef.current.find((w) => w.id === id);
        if (widget && (finalPos.col !== widget.position.col || finalPos.row !== widget.position.row)) {
          onMove(id, finalPos);
        }
      }
      activeIdRef.current = null;
      ghostPosRef.current = null;
      setActiveId(null);
      setGhostPos(null);
    },
    [onMove]
  );

  const handleDragCancel = useCallback(() => {
    moveCleanupRef.current?.();
    moveCleanupRef.current = null;
    activeIdRef.current = null;
    ghostPosRef.current = null;
    setActiveId(null);
    setGhostPos(null);
  }, []);

  // ── Resize drag ────────────────────────────────────────
  // Uses absolute pointer position relative to the widget's top-left corner
  // to determine the desired size, then snaps to nearest allowed size.

  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const handleResizeDragStart = useCallback(
    (widgetId: string, e: React.PointerEvent) => {
      e.preventDefault();

      // Clean up any lingering resize
      resizeCleanupRef.current?.();

      const widget = widgetsRef.current.find((w) => w.id === widgetId);
      if (!widget) return;

      const gridEl = gridRef.current;
      if (!gridEl) return;

      const meta = WIDGET_REGISTRY[widget.type];
      const allowedSizes = meta.allowedSizes;
      const originalSize = getEffectiveSize(widget);

      // Compute the widget's top-left in pixels from the grid
      const cw = cellWidthRef.current;
      const widgetLeft = (widget.position.col - 1) * (cw + GAP);
      const widgetTop = (widget.position.row - 1) * (ROW_HEIGHT + GAP);

      const initial = { widgetId, ghostSize: originalSize };
      resizeGhostRef.current = initial;
      setResizeDrag(initial);

      const onPointerMove = (ev: PointerEvent) => {
        const gridRect = gridEl.getBoundingClientRect();
        const cwNow = cellWidthRef.current;

        // Pointer position relative to widget's top-left corner
        const pointerRelToWidgetX = ev.clientX - gridRect.left - widgetLeft;
        const pointerRelToWidgetY = ev.clientY - gridRect.top - widgetTop;

        // Convert to column/row count (how many cols/rows the widget should span)
        // Add half-cell offset so the snap happens at the midpoint
        const targetCols = Math.max(1, Math.floor(pointerRelToWidgetX / (cwNow + GAP)) + 1);
        const targetRows = Math.max(1, Math.floor(pointerRelToWidgetY / (ROW_HEIGHT + GAP)) + 1);

        // Find nearest allowed size by Manhattan distance
        let bestSize = allowedSizes[0];
        let bestDist = Infinity;
        for (const s of allowedSizes) {
          const dist = Math.abs(s.cols - targetCols) + Math.abs(s.rows - targetRows);
          if (dist < bestDist) {
            bestDist = dist;
            bestSize = s;
          }
        }

        const prev = resizeGhostRef.current;
        if (!prev || prev.ghostSize.cols !== bestSize.cols || prev.ghostSize.rows !== bestSize.rows) {
          const next = { widgetId, ghostSize: bestSize };
          resizeGhostRef.current = next;
          setResizeDrag(next);
        }
      };

      const onPointerUp = () => {
        const final = resizeGhostRef.current;
        if (final && (final.ghostSize.cols !== originalSize.cols || final.ghostSize.rows !== originalSize.rows)) {
          onResizeRef.current(widgetId, final.ghostSize);
        }
        resizeGhostRef.current = null;
        setResizeDrag(null);
        cleanup();
      };

      const cleanup = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        resizeCleanupRef.current = null;
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      resizeCleanupRef.current = cleanup;
    },
    [] // no deps — reads everything from refs
  );

  // ── Derived ────────────────────────────────────────────

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;

  const maxRow = Math.max(
    ...widgets.map((w) => {
      const s = getEffectiveSize(w);
      return w.position.row + s.rows - 1;
    }),
    4
  );
  const totalRows = maxRow + (isEditMode ? 4 : 0);

  const gridContent = (
    <Box
      ref={gridRef}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gridTemplateRows: { md: `repeat(${totalRows}, ${ROW_HEIGHT}px)` },
        gridAutoRows: { xs: 140 },
        gridAutoFlow: { xs: 'dense' },
        gap: `${GAP}px`,
        pb: 2,
        position: 'relative',
      }}
    >
      {/* Grid lines overlay (edit mode) */}
      {isEditMode && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1,
            display: { xs: 'none', md: 'block' },
          }}
        >
          {/* 3 vertical column dividers */}
          {[0, 1, 2].map((i) => (
            <Box
              key={`col-${i}`}
              sx={{
                position: 'absolute',
                left: `${(i + 1) * (cellWidth + GAP) - GAP / 2}px`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundImage: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.15) 0 6px, transparent 6px 14px)',
              }}
            />
          ))}
          {/* Horizontal row dividers */}
          {Array.from({ length: totalRows }).map((_, i) => (
            <Box
              key={`row-${i}`}
              sx={{
                position: 'absolute',
                top: `${(i + 1) * (ROW_HEIGHT + GAP) - GAP / 2}px`,
                left: 0,
                right: 0,
                height: '1px',
                backgroundImage: 'repeating-linear-gradient(to right, rgba(255,255,255,0.15) 0 6px, transparent 6px 14px)',
              }}
            />
          ))}
        </Box>
      )}

      {widgets.map((widget, i) => {
        const { cols, rows } = getEffectiveSize(widget);
        const { col, row } = widget.position;
        return (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            key={widget.id}
            sx={{
              gridColumn: {
                xs: `span ${Math.min(cols, 2)}`,
                md: `${col} / span ${cols}`,
              },
              gridRow: {
                xs: `span ${rows}`,
                md: `${row} / span ${rows}`,
              },
            }}
          >
            <WidgetWrapper
              widget={widget}
              isEditMode={isEditMode}
              isDragging={widget.id === activeId}
              isResizing={resizeDrag?.widgetId === widget.id}
              onRemove={onRemove}
              onResizeDragStart={handleResizeDragStart}
              onChangeColor={onChangeColor}
              onResize={onResize}
            />
          </Box>
        );
      })}

      {/* Move ghost */}
      {ghostPos && activeWidget && (() => {
        const { cols, rows } = getEffectiveSize(activeWidget);
        return (
          <Box
            key="move-ghost"
            sx={{
              gridColumn: { md: `${ghostPos.col} / span ${cols}` },
              gridRow: { md: `${ghostPos.row} / span ${rows}` },
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: '16px',
              bgcolor: 'rgba(128,90,213,0.12)',
              pointerEvents: 'none',
              display: { xs: 'none', md: 'block' },
              zIndex: 5,
            }}
          />
        );
      })()}

      {/* Resize ghost */}
      {resizeDrag && (() => {
        const widget = widgets.find((w) => w.id === resizeDrag.widgetId);
        if (!widget) return null;
        const { cols, rows } = resizeDrag.ghostSize;
        return (
          <Box
            key="resize-ghost"
            sx={{
              gridColumn: { md: `${widget.position.col} / span ${cols}` },
              gridRow: { md: `${widget.position.row} / span ${rows}` },
              border: '2px dashed',
              borderColor: 'success.main',
              borderRadius: '16px',
              bgcolor: 'rgba(76,175,80,0.08)',
              pointerEvents: 'none',
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}
          >
            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'success.main',
                bgcolor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
              }}
            >
              {getSizeLabel(resizeDrag.ghostSize)}
            </Typography>
          </Box>
        );
      })()}
    </Box>
  );

  if (!isEditMode) return gridContent;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {gridContent}

      <DragOverlay dropAnimation={null}>
        {activeWidget && (() => {
          const { cols, rows } = getEffectiveSize(activeWidget);
          const OverlayComponent = WIDGET_COMPONENTS[activeWidget.type];
          return (
            <Box
              sx={{
                width: cols * cellWidth + (cols - 1) * GAP,
                height: rows * ROW_HEIGHT + (rows - 1) * GAP,
                boxShadow: 8,
                borderRadius: '16px',
                overflow: 'hidden',
                opacity: 0.9,
                pointerEvents: 'none',
              }}
            >
              <OverlayComponent size={getEffectiveSize(activeWidget)} color={activeWidget.color} />
            </Box>
          );
        })()}
      </DragOverlay>
    </DndContext>
  );
}
