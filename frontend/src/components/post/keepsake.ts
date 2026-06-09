/**
 * "Keepsake" design tokens shared by the postcard surfaces
 * (PostCard, PostGrid, explore / saved / post-detail pages).
 *
 * CSS variables come from the theme layer; the fallbacks keep the
 * postcards correct even before the variables are defined.
 */

export const GOLD = 'var(--viraha-gold, #D4A843)';
export const PAPER_LIGHT = 'var(--viraha-paper, #FAF6EE)';
export const INK_LIGHT = 'var(--viraha-ink, #221C18)';
export const PAPER_DARK = '#1D1727';
export const INK_DARK = '#F0E9DC';

export function paper(dark: boolean): string {
  return dark ? PAPER_DARK : PAPER_LIGHT;
}

export function ink(dark: boolean): string {
  return dark ? INK_DARK : INK_LIGHT;
}

export function inkMuted(dark: boolean): string {
  return dark ? 'rgba(240,233,220,0.62)' : 'rgba(34,28,24,0.6)';
}

export function hairline(dark: boolean): string {
  return dark ? 'rgba(212,168,67,0.28)' : 'rgba(34,28,24,0.16)';
}

export function hardShadow(dark: boolean): string {
  return dark ? '4px 4px 0 rgba(0,0,0,0.38)' : '4px 4px 0 rgba(34,28,24,0.08)';
}

/** Subtle paper-grain texture (pure CSS — no asset files). */
export function grain(dark: boolean): string {
  return dark
    ? 'repeating-linear-gradient(0deg, rgba(255,255,255,0.016) 0px, rgba(255,255,255,0.016) 1px, transparent 1px, transparent 3px)'
    : 'repeating-linear-gradient(0deg, rgba(34,28,24,0.02) 0px, rgba(34,28,24,0.02) 1px, transparent 1px, transparent 3px)';
}

/** Posterama eyebrow / microtext styling. Spread into `sx`. */
export const EYEBROW_SX = {
  fontFamily: 'var(--font-brand)',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: '0.6875rem',
  fontWeight: 600,
  lineHeight: 1.4,
} as const;

/**
 * The backend redacts hidden locations by nulling lat/lng while keeping
 * city/country. The Post type declares numbers, so guard at runtime.
 */
export function hasCoordinates(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

/** "47.6062° N, 122.3321° W" — coordinates eyebrow text. */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}
