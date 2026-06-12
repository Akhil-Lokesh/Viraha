import type { SxProps, Theme } from '@mui/material';
import { CIN } from '@/lib/design/cinema-tokens';

/** Dark-cinematic text field: surface bg, hairline border, accent focus ring. */
export const darkFieldSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: CIN.surface,
    color: CIN.text,
    transition: 'box-shadow .2s ease',
    '& fieldset': { borderColor: CIN.hairline },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
    '&.Mui-focused fieldset': { borderColor: CIN.accent, borderWidth: '1px' },
    '&.Mui-focused': { boxShadow: `0 0 0 3px rgba(139,124,255,0.18)` },
  },
  '& .MuiOutlinedInput-input::placeholder': { color: CIN.textMuted, opacity: 0.8 },
};

/** Muted label above a dark form field. */
export const fieldLabelSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  fontSize: '0.8125rem',
  fontWeight: 600,
  userSelect: 'none',
  color: CIN.textMuted,
  '&.Mui-focused': { color: CIN.textMuted },
};
