import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';
import type { WidgetInstance, WidgetType, GridPosition, WidgetGridSize } from '../types/dashboard';
import {
  DEFAULT_WIDGETS,
  WIDGET_REGISTRY,
  createWidgetInstance,
  getEffectiveSize,
  isInBounds,
  hasOverlap,
  findFirstAvailable,
} from '../dashboard/widget-registry';

interface DashboardState {
  widgets: WidgetInstance[];
  isEditMode: boolean;
  setEditMode: (val: boolean) => void;
  moveWidget: (id: string, position: GridPosition) => void;
  resizeWidget: (id: string, newSize: WidgetGridSize) => boolean;
  addWidget: (type: WidgetType, color?: string, albumId?: string) => void;
  removeWidget: (id: string) => void;
  changeWidgetColor: (id: string, color: string) => void;
  resetToDefault: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: DEFAULT_WIDGETS,
      isEditMode: false,
      setEditMode: (val) => set({ isEditMode: val }),

      moveWidget: (id, newPosition) =>
        set((state) => {
          const widget = state.widgets.find((w) => w.id === id);
          if (!widget) return state;
          const size = getEffectiveSize(widget);
          if (!isInBounds(newPosition, size)) return state;

          // Move the dragged widget first
          let updated = state.widgets.map((w) =>
            w.id === id ? { ...w, position: newPosition } : w
          );

          // Relocate any widgets that now overlap with the moved widget
          for (const w of updated) {
            if (w.id === id) continue;
            const ws = getEffectiveSize(w);
            const overlaps =
              newPosition.col < w.position.col + ws.cols &&
              newPosition.col + size.cols > w.position.col &&
              newPosition.row < w.position.row + ws.rows &&
              newPosition.row + size.rows > w.position.row;
            if (overlaps) {
              const others = updated.filter((u) => u.id !== w.id);
              const newPos = findFirstAvailable(ws, others);
              updated = updated.map((u) =>
                u.id === w.id ? { ...u, position: newPos } : u
              );
            }
          }

          return { widgets: updated };
        }),

      resizeWidget: (id, newSize) => {
        const state = get();
        const widget = state.widgets.find((w) => w.id === id);
        if (!widget) return false;

        const meta = WIDGET_REGISTRY[widget.type];
        const isAllowed = meta.allowedSizes.some(
          (s) => s.cols === newSize.cols && s.rows === newSize.rows
        );
        if (!isAllowed) return false;

        // 1) Try at current position
        if (
          isInBounds(widget.position, newSize) &&
          !hasOverlap(widget.position, newSize, state.widgets, id)
        ) {
          set({
            widgets: state.widgets.map((w) =>
              w.id === id ? { ...w, gridSize: newSize } : w
            ),
          });
          return true;
        }

        // 2) Search all positions, nearest first
        const otherWidgets = state.widgets.filter((w) => w.id !== id);
        const pos = findFirstAvailable(newSize, otherWidgets);
        set({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, gridSize: newSize, position: pos } : w
          ),
        });
        return true;
      },

      addWidget: (type, color, albumId) =>
        set((state) => {
          const gridSize = WIDGET_REGISTRY[type].gridSize;
          const position = findFirstAvailable(gridSize, state.widgets);
          return {
            widgets: [...state.widgets, createWidgetInstance(type, position, color, albumId)],
          };
        }),

      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        })),

      changeWidgetColor: (id, color) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, color } : w
          ),
        })),

      resetToDefault: () => set({ widgets: DEFAULT_WIDGETS }),
    }),
    {
      name: 'viraha-dashboard',
      version: 5,
      migrate: () => ({ widgets: DEFAULT_WIDGETS, isEditMode: false }),
    }
  )
);

export function useDashboardHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useDashboardStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useDashboardStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  return hydrated;
}
