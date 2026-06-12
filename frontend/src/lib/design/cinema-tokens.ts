import type { SxProps, Theme } from '@mui/material';

/**
 * Dark-cinematic palette — single source of truth.
 * CSS-var names mirror these (see globals.css `--cin-*`).
 * Photos are the light source; the UI is the dark room around them.
 */
export const CIN = {
  bg: '#0B0B0F',
  surface: '#141419',
  surface2: '#1C1C24',
  hairline: 'rgba(255,255,255,0.08)',
  text: '#F4F4F6',
  textMuted: '#9A9AA6',
  accent: '#8B7CFF',
  accentGlow: 'rgba(139,124,255,0.35)',
  danger: '#FF6B6B',
} as const;

/** Muted uppercase eyebrow/section label. */
export const eyebrowSx: SxProps<Theme> = {
  fontFamily: 'Posterama, var(--font-body)',
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  fontSize: 11,
  color: 'var(--cin-text-muted, #9A9AA6)',
};

/** Large display heading. */
export const displaySx: SxProps<Theme> = {
  fontFamily: 'Posterama, var(--font-body)',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: 'var(--cin-text, #F4F4F6)',
  lineHeight: 1.02,
};

/** Bottom-weighted vignette so captions stay legible over photos. */
export const photoVignette =
  'linear-gradient(to top, rgba(11,11,15,0.85) 0%, rgba(11,11,15,0.15) 45%, rgba(11,11,15,0) 70%)';

/** Hover-glow ring used on interactive photo/cards. */
export const glowRing = (px = 1): string =>
  `0 0 0 ${px}px var(--cin-accent, #8B7CFF), 0 8px 40px var(--cin-accent-glow, rgba(139,124,255,0.35))`;
