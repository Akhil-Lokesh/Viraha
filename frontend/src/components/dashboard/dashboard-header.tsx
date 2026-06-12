'use client';

import { Box, Typography } from '@mui/material';
import { Settings2, Check, RotateCcw, Plus } from 'lucide-react';
import { useTravelStore } from '@/lib/stores/travel-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { eyebrowSx, displaySx } from '@/lib/design/cinema-tokens';

interface DashboardHeaderProps {
  isEditMode: boolean;
  onToggleEdit: () => void;
  onReset: () => void;
  onOpenCatalog: () => void;
}

export function DashboardHeader({ isEditMode, onToggleEdit, onReset, onOpenCatalog }: DashboardHeaderProps) {
  const mode = useTravelStore((s) => s.mode);
  const user = useAuthStore((s) => s.user);

  const firstName = user?.displayName?.trim().split(/\s+/)[0] || 'traveler';
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const modeLabel = mode === 'traveling' ? 'En route' : 'Home base';

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: { xs: 3, md: 4 }, flexShrink: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        {/* Eyebrow — date + travel mode */}
        <Typography component="p" suppressHydrationWarning sx={{ ...eyebrowSx, mb: 1 }}>
          {today}
          <Box component="span" sx={{ mx: 1.25 }} aria-hidden="true">
            &middot;
          </Box>
          {mode === 'traveling' && (
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: 'var(--cin-accent, #8B7CFF)',
                boxShadow: '0 0 8px var(--cin-accent-glow, rgba(139,124,255,0.35))',
                mr: 0.75,
                verticalAlign: 'middle',
              }}
            />
          )}
          <Box component="span">{modeLabel}</Box>
        </Typography>

        {/* Display greeting */}
        <Typography
          component="h1"
          sx={{
            ...displaySx,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
          }}
        >
          Welcome back, {firstName}
        </Typography>
      </Box>

      {/* Quiet edit controls — de-emphasized, fully functional */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pb: 0.5, flexShrink: 0 }}>
        {isEditMode && (
          <>
            <QuietIconButton onClick={onOpenCatalog} title="Add Widget">
              <Plus style={{ width: 15, height: 15 }} />
            </QuietIconButton>
            <QuietIconButton onClick={onReset} title="Reset to Default">
              <RotateCcw style={{ width: 14, height: 14 }} />
            </QuietIconButton>
          </>
        )}

        <QuietIconButton
          onClick={onToggleEdit}
          title={isEditMode ? 'Done' : 'Edit Dashboard'}
          active={isEditMode}
        >
          {isEditMode ? <Check style={{ width: 15, height: 15 }} /> : <Settings2 style={{ width: 15, height: 15 }} />}
        </QuietIconButton>
      </Box>
    </Box>
  );
}

interface QuietIconButtonProps {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}

function QuietIconButton({ onClick, title, active = false, children }: QuietIconButtonProps) {
  return (
    <Box
      component="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      sx={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        bgcolor: active ? 'rgba(139,124,255,0.12)' : 'transparent',
        border: '1px solid',
        borderColor: active ? 'var(--cin-accent, #8B7CFF)' : 'var(--cin-hairline, rgba(255,255,255,0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: active ? 'var(--cin-accent, #8B7CFF)' : 'var(--cin-text-muted, #9A9AA6)',
        '&:hover': {
          borderColor: 'var(--cin-accent, #8B7CFF)',
          color: 'var(--cin-accent, #8B7CFF)',
        },
        transition: 'color 0.2s, border-color 0.2s, background-color 0.2s',
        p: 0,
      }}
    >
      {children}
    </Box>
  );
}
