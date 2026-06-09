import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Shared "calm paper" surface for settings panels, per the Keepsake brief:
 * flat paper, 1px hairline border, small hard offset shadow — no soft
 * ambient blur. `background.paper` follows the theme so dark mode keeps
 * working; the hairline + offset shadow carry the paper feel.
 *
 * Declared with `satisfies` (not a plain SxProps annotation) so callers can
 * spread it into their own sx objects.
 */
export const paperPanelSx = {
  borderRadius: '10px',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  // Per-scheme CSS var (globals.css) — the light-ink offset shadow is
  // invisible on dark surfaces, so dark mode swaps to a black offset.
  boxShadow: 'var(--viraha-paper-shadow, 2px 2px 0 rgba(34, 28, 24, 0.06))',
  p: 3,
} satisfies SxProps<Theme>;

/** Gold accent used for active states / highlights inside settings. */
export const VIRAHA_GOLD = 'var(--viraha-gold, #D4A843)';
