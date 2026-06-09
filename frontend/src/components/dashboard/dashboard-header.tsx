'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { Settings2, Check, RotateCcw, Plus } from 'lucide-react';
import { useTravelStore } from '@/lib/stores/travel-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getJournalTokens, eyebrowSx, displaySerifSx } from './journal-tokens';

interface DashboardHeaderProps {
  isEditMode: boolean;
  onToggleEdit: () => void;
  onReset: () => void;
  onOpenCatalog: () => void;
}

export function DashboardHeader({ isEditMode, onToggleEdit, onReset, onOpenCatalog }: DashboardHeaderProps) {
  const theme = useTheme();
  const t = getJournalTokens(theme.palette.mode === 'dark' ? 'dark' : 'light');
  const mode = useTravelStore((s) => s.mode);
  const user = useAuthStore((s) => s.user);

  const firstName = user?.displayName?.trim().split(/\s+/)[0] || 'traveler';
  const today = new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();
  const modeLabel = mode === 'traveling' ? 'EN ROUTE' : 'HOME BASE';

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: { xs: 3, md: 4 }, flexShrink: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        {/* Posterama eyebrow — date + travel mode */}
        <Typography component="p" sx={{ ...eyebrowSx, color: t.gold, mb: 1 }}>
          {today}
          <Box component="span" sx={{ mx: 1.25, color: t.inkSoft }}>
            &middot;
          </Box>
          <Box component="span" sx={{ color: t.inkSoft }}>{modeLabel}</Box>
        </Typography>

        {/* ResotYc greeting */}
        <Typography
          component="h1"
          sx={{
            ...displaySerifSx,
            color: t.ink,
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
            <QuietIconButton onClick={onOpenCatalog} title="Add Widget" gold={t.gold} ink={t.inkSoft} hairline={t.inkHairline}>
              <Plus style={{ width: 15, height: 15 }} />
            </QuietIconButton>
            <QuietIconButton onClick={onReset} title="Reset to Default" gold={t.gold} ink={t.inkSoft} hairline={t.inkHairline}>
              <RotateCcw style={{ width: 14, height: 14 }} />
            </QuietIconButton>
          </>
        )}

        <QuietIconButton
          onClick={onToggleEdit}
          title={isEditMode ? 'Done' : 'Edit Dashboard'}
          gold={t.gold}
          ink={t.inkSoft}
          hairline={t.inkHairline}
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
  gold: string;
  ink: string;
  hairline: string;
  active?: boolean;
  children: React.ReactNode;
}

function QuietIconButton({ onClick, title, gold, ink, hairline, active = false, children }: QuietIconButtonProps) {
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
        bgcolor: 'transparent',
        border: '1px solid',
        borderColor: active ? gold : hairline,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: active ? gold : ink,
        '&:hover': { borderColor: gold, color: gold },
        transition: 'color 0.2s, border-color 0.2s',
        p: 0,
      }}
    >
      {children}
    </Box>
  );
}
