'use client';

import { Box, Typography, Popover } from '@mui/material';
import type { WidgetGridSize } from '@/lib/types/dashboard';
import { getSizeLabel } from '@/lib/dashboard/widget-registry';

interface WidgetSizePopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  label: string;
  currentSize: WidgetGridSize;
  allowedSizes: WidgetGridSize[];
  onSelect: (size: WidgetGridSize) => void;
}

export function WidgetSizePopover({
  anchorEl,
  onClose,
  label,
  currentSize,
  allowedSizes,
  onSelect,
}: WidgetSizePopoverProps) {
  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '12px',
            p: 2,
            minWidth: 200,
            mt: 1,
          },
        },
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}>
        {label}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {allowedSizes.map((size) => {
          const isActive = size.cols === currentSize.cols && size.rows === currentSize.rows;
          // Visual preview — proportional rectangles (max 48px)
          const scale = 12;
          const w = size.cols * scale;
          const h = size.rows * scale;

          return (
            <Box
              key={`${size.cols}-${size.rows}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                onSelect(size);
                onClose();
              }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                cursor: 'pointer',
                p: 1,
                borderRadius: '8px',
                bgcolor: isActive ? 'primary.main' : 'transparent',
                '&:hover': { bgcolor: isActive ? 'primary.main' : 'action.hover' },
                transition: 'background-color 0.15s',
              }}
            >
              {/* Proportional size preview */}
              <Box
                sx={{
                  width: w,
                  height: h,
                  borderRadius: '4px',
                  border: '2px solid',
                  borderColor: isActive ? 'primary.contrastText' : 'divider',
                  bgcolor: isActive ? 'rgba(255,255,255,0.2)' : 'action.hover',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  fontSize: '10px',
                  color: isActive ? 'primary.contrastText' : 'text.secondary',
                  whiteSpace: 'nowrap',
                }}
              >
                {getSizeLabel(size)}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Popover>
  );
}
