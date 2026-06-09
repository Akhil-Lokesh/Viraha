import type { Variants } from 'framer-motion';

/**
 * Journal "Keepsake" design tokens for the home spread.
 * CSS variables come from the theme layer; the fallbacks are mode-correct
 * so the page never renders unreadable if a variable is missing.
 */
export interface JournalTokens {
  paper: string;
  ink: string;
  inkSoft: string;
  gold: string;
  goldHairline: string;
  inkHairline: string;
  grain: string;
}

export function getJournalTokens(mode: 'light' | 'dark'): JournalTokens {
  const isDark = mode === 'dark';
  return {
    paper: isDark ? 'var(--viraha-paper, #16121F)' : 'var(--viraha-paper, #FAF6EE)',
    ink: isDark ? 'var(--viraha-ink, #F2EAD8)' : 'var(--viraha-ink, #221C18)',
    inkSoft: isDark ? 'rgba(242,234,216,0.62)' : 'rgba(34,28,24,0.62)',
    gold: 'var(--viraha-gold, #D4A843)',
    goldHairline: isDark ? 'rgba(212,168,67,0.45)' : 'rgba(212,168,67,0.65)',
    inkHairline: isDark ? 'rgba(242,234,216,0.16)' : 'rgba(34,28,24,0.14)',
    // Subtle paper-grain texture — no asset files, pure CSS.
    grain: isDark
      ? 'repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 3px)'
      : 'repeating-linear-gradient(0deg, rgba(34,28,24,0.02) 0 1px, transparent 1px 3px)',
  };
}

/** Posterama eyebrow style, reused across the spread. */
export const eyebrowSx = {
  fontFamily: 'var(--font-brand, Posterama, sans-serif)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  lineHeight: 1.4,
};

/** ResotYc display-serif style. */
export const displaySerifSx = {
  fontFamily: 'var(--font-accent, ResotYc, serif)',
  fontWeight: 400,
  lineHeight: 1.1,
};

/** One orchestrated page-load reveal: the page container staggers its children. */
export const spreadContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.04 },
  },
};

export const spreadItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};
