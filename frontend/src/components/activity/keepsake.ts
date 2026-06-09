import type { Variants } from 'framer-motion';

/**
 * "The Keepsake" tokens for the activity surface. The CSS variables are
 * defined globally by the theme (with theme-aware dark values); the fallbacks
 * keep the page presentable if they are ever missing.
 */
export const KEEPSAKE = {
  paper: 'var(--viraha-paper, #FAF6EE)',
  ink: 'var(--viraha-ink, #221C18)',
  gold: 'var(--viraha-gold, #D4A843)',
  goldSoft: 'rgba(212, 168, 67, 0.12)',
  hairline: 'rgba(212, 168, 67, 0.35)',
} as const;

/** Posterama eyebrow treatment — uppercase, letter-spaced microtext. */
export const eyebrowSx = {
  fontFamily: 'var(--font-brand)',
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  fontSize: '11px',
  lineHeight: 1.6,
} as const;

/** One orchestrated page-load reveal: parent staggers, children fade up. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};
