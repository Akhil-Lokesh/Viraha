'use client';

import { useState } from 'react';
import { Box, Popover, Typography } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, X, Palette, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WidgetInstance, WidgetGridSize } from '@/lib/types/dashboard';
import { WIDGET_REGISTRY, WIDGET_COLORS, getEffectiveSize, getSizeLabel, formatGridSize } from '@/lib/dashboard/widget-registry';
import { WIDGET_COMPONENTS } from './widgets';
import { widgetEditShake } from '@/lib/animations';

interface WidgetWrapperProps {
  widget: WidgetInstance;
  isEditMode: boolean;
  isDragging: boolean;
  isResizing: boolean;
  onRemove: (id: string) => void;
  onResizeDragStart: (id: string, e: React.PointerEvent) => void;
  onChangeColor?: (id: string, color: string) => void;
  onResize?: (id: string, newSize: WidgetGridSize) => boolean;
}

export function WidgetWrapper({
  widget,
  isEditMode,
  isDragging,
  isResizing,
  onRemove,
  onResizeDragStart,
  onChangeColor,
  onResize,
}: WidgetWrapperProps) {
  const Component = WIDGET_COMPONENTS[widget.type];
  const meta = WIDGET_REGISTRY[widget.type];
  const effectiveSize = getEffectiveSize(widget);
  const hasMultipleSizes = meta.allowedSizes.length > 1;
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);
  const [sizeAnchor, setSizeAnchor] = useState<HTMLElement | null>(null);

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: widget.id,
    disabled: !isEditMode,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: 'relative',
        height: '100%',
        opacity: isDragging || isResizing ? 0.3 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {isEditMode && (
        <>
          {/* Drag handle */}
          <Box
            {...attributes}
            {...listeners}
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 20,
              width: 28,
              height: 28,
              borderRadius: '6px',
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <GripVertical style={{ width: 16, height: 16, color: 'white' }} />
          </Box>

          {/* Color picker button */}
          <Box
            component="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => setColorAnchor(e.currentTarget)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 40,
              zIndex: 20,
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: widget.color || '#7B68EE',
              border: '2px solid white',
              boxShadow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.1)' },
              transition: 'transform 0.15s',
              p: 0,
            }}
          >
            <Palette style={{ width: 12, height: 12, color: 'white' }} />
          </Box>

          {/* Color picker popover */}
          <Popover
            open={Boolean(colorAnchor)}
            anchorEl={colorAnchor}
            onClose={() => setColorAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            slotProps={{
              paper: {
                sx: {
                  p: 1.5,
                  borderRadius: '12px',
                  display: 'flex',
                  gap: 0.75,
                  mt: 0.5,
                },
              },
            }}
          >
            {WIDGET_COLORS.map((wc) => (
              <Box
                key={wc.hex}
                component="button"
                onClick={() => {
                  onChangeColor?.(widget.id, wc.hex);
                  setColorAnchor(null);
                }}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  bgcolor: wc.hex,
                  border: widget.color === wc.hex ? '2px solid' : '2px solid transparent',
                  borderColor: widget.color === wc.hex ? 'text.primary' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 0,
                  '&:hover': { transform: 'scale(1.15)' },
                  transition: 'transform 0.15s, border-color 0.15s',
                }}
              >
                {widget.color === wc.hex && (
                  <Check style={{ width: 12, height: 12, color: 'white' }} />
                )}
              </Box>
            ))}
          </Popover>

          {/* Delete button */}
          <Box
            component="button"
            onClick={() => onRemove(widget.id)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 20,
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'error.main',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
              transition: 'opacity 0.2s',
            }}
          >
            <X style={{ width: 14, height: 14, color: 'white' }} />
          </Box>

          {/* Resize controls (bottom-right) */}
          {hasMultipleSizes && (
            <>
              {/* Size picker button — shows current size label */}
              <Box
                component="button"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  setSizeAnchor(e.currentTarget);
                }}
                sx={{
                  position: 'absolute',
                  bottom: 6,
                  right: 32,
                  zIndex: 20,
                  px: 1,
                  py: 0.25,
                  borderRadius: '6px',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  transition: 'background-color 0.15s',
                }}
              >
                <Typography sx={{ fontSize: '10px', fontWeight: 600, color: 'white', lineHeight: 1 }}>
                  {getSizeLabel(effectiveSize)}
                </Typography>
              </Box>

              {/* Size picker popover */}
              <Popover
                open={Boolean(sizeAnchor)}
                anchorEl={sizeAnchor}
                onClose={() => setSizeAnchor(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                slotProps={{
                  paper: {
                    sx: {
                      p: 1,
                      borderRadius: '10px',
                      mb: 0.5,
                    },
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 100 }}>
                  {meta.allowedSizes.map((s) => {
                    const isActive = s.cols === effectiveSize.cols && s.rows === effectiveSize.rows;
                    return (
                      <Box
                        key={`${s.cols}x${s.rows}`}
                        component="button"
                        onClick={() => {
                          if (!isActive) {
                            onResize?.(widget.id, s);
                          }
                          setSizeAnchor(null);
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.5,
                          px: 1.5,
                          py: 0.75,
                          borderRadius: '6px',
                          border: 'none',
                          bgcolor: isActive ? 'action.selected' : 'transparent',
                          cursor: isActive ? 'default' : 'pointer',
                          '&:hover': { bgcolor: isActive ? 'action.selected' : 'action.hover' },
                          transition: 'background-color 0.15s',
                        }}
                      >
                        <Typography sx={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: 'text.primary' }}>
                          {getSizeLabel(s)}
                        </Typography>
                        <Typography sx={{ fontSize: '10px', color: 'text.secondary' }}>
                          {formatGridSize(s.cols, s.rows)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Popover>

              {/* Resize drag handle */}
              <Box
                onPointerDown={(e: React.PointerEvent) => {
                  e.stopPropagation();
                  onResizeDragStart(widget.id, e);
                }}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  zIndex: 20,
                  cursor: 'nwse-resize',
                  touchAction: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottomRightRadius: '16px',
                  '&:hover svg': { opacity: 1 },
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  style={{ opacity: 0.5, transition: 'opacity 0.15s' }}
                >
                  <line x1="12" y1="2" x2="2" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="7" x2="7" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="12" x2="12" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </Box>
            </>
          )}
        </>
      )}

      {isEditMode && !isDragging ? (
        <motion.div
          variants={widgetEditShake}
          animate="shake"
          style={{ height: '100%' }}
        >
          <Component size={effectiveSize} color={widget.color} albumId={widget.albumId} />
        </motion.div>
      ) : (
        <Component size={effectiveSize} color={widget.color} albumId={widget.albumId} />
      )}
    </Box>
  );
}
