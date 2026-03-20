import type { Variants } from 'framer-motion';

export const easeOutQuart: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export const easeNative: [number, number, number, number] = [0.2, 0.65, 0.4, 0.95];

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeNative } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: easeNative } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: easeNative } },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: easeNative } },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: easeNative } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: easeNative } },
};

export const cardHover: Variants = {
  rest: { scale: 1, boxShadow: '0 1px 3px rgba(0,41,61,0.08)' },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 40px rgba(0,41,61,0.10)',
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
};

export const imageZoom: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: easeNative } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const counterAnimation = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const widgetEditShake: Variants = {
  shake: {
    rotate: [0, -0.5, 0.5, -0.5, 0],
    transition: { duration: 0.4, repeat: Infinity, repeatDelay: 0.8 },
  },
};

export const widgetDragOverlay: Variants = {
  initial: { scale: 1 },
  dragging: { scale: 1.05, boxShadow: '0 16px 40px rgba(0,0,0,0.15)', transition: { duration: 0.2 } },
};
