import type { Variants } from 'framer-motion';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';
import { easeNative } from '@/lib/animations';

/**
 * Shared dark-cinematic styles for the settings area: inputs on
 * `--cin-surface-2` with an accent focus ring, eyebrow form labels,
 * dark dialog paper, accent switches, and the orchestrated page-load
 * stagger used by every tab.
 */

/** Dark text field: surface-2 background, hairline border, accent focus ring. */
export const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    bgcolor: 'var(--cin-surface-2, #1C1C24)',
    color: CIN.text,
    '& fieldset': { borderColor: CIN.hairline },
    '&:hover fieldset': { borderColor: 'rgba(139,124,255,0.4)' },
    '&.Mui-focused fieldset': {
      borderColor: CIN.accent,
      boxShadow: '0 0 0 3px rgba(139,124,255,0.18)',
    },
  },
  '& .MuiInputBase-input::placeholder': { color: CIN.textMuted, opacity: 0.7 },
} as const;

/** Uppercase eyebrow-style form label. */
export const labelSx = {
  ...eyebrowSx,
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  userSelect: 'none',
} as const;

/** Dark dialog surface: hairline border, no MUI overlay gradient. */
export const dialogPaperSx = {
  borderRadius: '16px',
  bgcolor: 'var(--cin-surface, #141419)',
  backgroundImage: 'none',
  border: `1px solid ${CIN.hairline}`,
} as const;

/** Accent-tinted MUI switch for dark surfaces. */
export const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: CIN.accent },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: CIN.accent,
    opacity: 0.5,
  },
} as const;

/** Destructive outline styling layered onto a ghost GlowButton. */
export const dangerOutlineSx = {
  border: '1px solid rgba(255,107,107,0.45)',
  color: CIN.danger,
  '&:hover': {
    bgcolor: 'rgba(255,107,107,0.08)',
    border: `1px solid ${CIN.danger}`,
    boxShadow: 'none',
  },
} as const;

/** Parent variants for the orchestrated page-load stagger (~50ms apart). */
export const settingsStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

/** Child variants: fade + y:10→0 per section. */
export const settingsItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeNative } },
};

/** Subtle hover tint + nudge for list rows. */
export const rowHoverSx = {
  borderRadius: '10px',
  transition: 'background-color .2s ease, transform .2s ease',
  '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', transform: 'translateX(2px)' },
} as const;
