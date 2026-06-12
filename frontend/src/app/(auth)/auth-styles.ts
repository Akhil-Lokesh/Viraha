import type { SxProps, Theme } from '@mui/material';
import type { Variants } from 'framer-motion';

/** Orchestrated page-load stagger: ~50ms between items, y:10→0 + fade. */
export const authStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

export const authItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

/**
 * Dark cinematic text field: input on surface-2, eyebrow label,
 * accent focus ring, hairline borders.
 */
export const authFieldSx: SxProps<Theme> = {
  '& .MuiInputLabel-root': {
    fontFamily: 'Posterama, var(--font-body)',
    fontWeight: 600,
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--cin-text-muted)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'var(--cin-accent)',
  },
  '& .MuiInputLabel-root.Mui-error': {
    color: 'var(--cin-danger)',
  },
  '& .MuiOutlinedInput-root': {
    height: 48,
    borderRadius: '10px',
    bgcolor: 'var(--cin-surface-2)',
    color: 'var(--cin-text)',
    transition: 'box-shadow .2s ease',
    '& fieldset': { borderColor: 'var(--cin-hairline)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.22)' },
    '&.Mui-focused': { boxShadow: '0 0 0 3px var(--cin-accent-glow)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--cin-accent)' },
    '&.Mui-error fieldset': { borderColor: 'var(--cin-danger)' },
  },
  '& .MuiOutlinedInput-input::placeholder': {
    color: 'var(--cin-text-muted)',
    opacity: 0.7,
  },
  '& .MuiFormHelperText-root': {
    color: 'var(--cin-text-muted)',
    '&.Mui-error': { color: 'var(--cin-danger)' },
  },
};

/** Accent link treatment for auth flows. */
export const authLinkSx: SxProps<Theme> = {
  fontSize: '0.875rem',
  color: 'var(--cin-accent)',
  fontWeight: 500,
  '&:hover': { textDecoration: 'underline' },
};

/** Hairline "or continue with" divider. */
export const authDividerSx: SxProps<Theme> = {
  fontFamily: 'Posterama, var(--font-body)',
  fontSize: '0.65rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--cin-text-muted)',
  '&::before, &::after': {
    borderTop: '1px solid var(--cin-hairline)',
    borderBottom: 'none',
  },
};

/** Square status icon chip (success/error cards) — dark surface, hairline. */
export const statusChipSx: SxProps<Theme> = {
  width: 56,
  height: 56,
  borderRadius: '14px',
  border: '1px solid var(--cin-hairline)',
  bgcolor: 'var(--cin-surface-2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
