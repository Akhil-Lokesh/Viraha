'use client';

import { Box, Typography } from '@mui/material';
import { Calendar, Settings2, Check, RotateCcw, Plus } from 'lucide-react';
import { useTravelStore } from '@/lib/stores/travel-store';

interface DashboardHeaderProps {
  isEditMode: boolean;
  onToggleEdit: () => void;
  onReset: () => void;
  onOpenCatalog: () => void;
}

export function DashboardHeader({ isEditMode, onToggleEdit, onReset, onOpenCatalog }: DashboardHeaderProps) {
  const mode = useTravelStore((s) => s.mode);
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexShrink: 0 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          My Travels
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {mode === 'traveling' ? 'Traveling' : 'Local Mode'} &bull; Reflecting
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isEditMode && (
          <>
            <IconButton onClick={onOpenCatalog} title="Add Widget">
              <Plus style={{ width: 16, height: 16 }} />
            </IconButton>
            <IconButton onClick={onReset} title="Reset to Default">
              <RotateCcw style={{ width: 16, height: 16 }} />
            </IconButton>
          </>
        )}

        <IconButton onClick={onToggleEdit} title={isEditMode ? 'Done' : 'Edit Dashboard'}>
          {isEditMode ? (
            <Check style={{ width: 16, height: 16 }} />
          ) : (
            <Settings2 style={{ width: 16, height: 16 }} />
          )}
        </IconButton>

        {!isEditMode && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'background.paper',
              borderRadius: '9999px',
              px: 2,
              py: 1,
              boxShadow: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Calendar style={{ width: 16, height: 16, color: 'var(--mui-palette-text-secondary)' }} />
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
              {today}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function IconButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      title={title}
      sx={{
        width: 36,
        height: 36,
        borderRadius: '10px',
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'text.secondary',
        '&:hover': { bgcolor: 'action.hover' },
        transition: 'background-color 0.2s',
        boxShadow: 1,
      }}
    >
      {children}
    </Box>
  );
}
