'use client';

import { createTheme, alpha } from '@mui/material/styles';
import type { Shadows } from '@mui/material/styles';

// ── M3 palette augmentation ────────────────────────────────────────────
declare module '@mui/material/styles' {
  interface Palette {
    viraha: {
      purple50: string;
      purple100: string;
      purple200: string;
      purple300: string;
      purple400: string;
      purple: string;
      purple600: string;
      purple700: string;
      purple800: string;
      purple900: string;
      gold: string;
      goldLight: string;
      journal: string;
      journalDark: string;
      cream: string;
      warmGray: string;
    };
    tertiary: Palette['primary'];
    surfaceTint: string;
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    outline: string;
    outlineVariant: string;
  }
  interface PaletteOptions {
    viraha?: Palette['viraha'];
    tertiary?: PaletteOptions['primary'];
    surfaceTint?: string;
    surfaceContainerLowest?: string;
    surfaceContainerLow?: string;
    surfaceContainer?: string;
    surfaceContainerHigh?: string;
    surfaceContainerHighest?: string;
    outline?: string;
    outlineVariant?: string;
  }
}

// ── Viraha brand tokens (shared) ───────────────────────────────────────
const virahaPalette = {
  purple50: '#F5F3FF',
  purple100: '#EDE9FE',
  purple200: '#DDD6FE',
  purple300: '#C4B5FD',
  purple400: '#A78BFA',
  purple: '#7B68EE',
  purple600: '#6D5BD0',
  purple700: '#5A4FCF',
  purple800: '#4338CA',
  purple900: '#312E81',
  gold: '#D4A843',
  goldLight: '#F5E6C4',
  journal: '#FFF8E1',
  journalDark: '#2D2A1F',
  cream: '#fff2e5',
  warmGray: '#e7eaee',
};

// ── Keepsake surface tokens (mirror of --viraha-* CSS vars in globals.css) ──
// Light: warm cream paper. Dark: deep ink-plum. Keep hex literals here so MUI
// can derive color channels; globals.css owns the var(--viraha-*) contract.
const keepsake = {
  light: {
    paper: '#FAF6EE',
    paperRaised: '#FFFDF7',
    ink: '#221C18',
    inkMuted: '#6F655C',
    gold: '#D4A843',
    hairline: alpha('#221C18', 0.15),
  },
  // Dark scheme = "Dark Cinematic": near-black room, photos are the light source.
  dark: {
    paper: '#0B0B0F',
    paperRaised: '#141419',
    ink: '#F4F4F6',
    inkMuted: '#9A9AA6',
    gold: '#E2BC5C',
    hairline: alpha('#FFFFFF', 0.08),
  },
};

// ── Hard offset shadows (replace soft ambient blur per design brief) ──
// Hairline ring + small hard drop; resolves per-mode via --viraha-hairline.
const hardShadow = (offset: number): string =>
  `0 0 0 1px var(--viraha-hairline, rgba(34, 28, 24, 0.15)), ${offset}px ${offset}px 0 rgba(0, 0, 0, 0.10)`;

const keepsakeShadows = [
  'none',
  ...Array.from({ length: 24 }, (_, i) => hardShadow(Math.min(Math.floor(i / 6) + 1, 4))),
] as Shadows;

// ── M3 shape scale ─────────────────────────────────────────────────────
const m3Shape = {
  borderRadius: 12, // M3 "medium"
};

// ── Shared breakpoints ─────────────────────────────────────────────────
const breakpoints = {
  values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 },
};

// ── Shared typography ──────────────────────────────────────────────────
const typography = {
  fontFamily: 'var(--font-body)',
  h1: { fontFamily: 'var(--font-heading)', fontWeight: 400, letterSpacing: '-0.025em' },
  h2: { fontFamily: 'var(--font-heading)', fontWeight: 400, letterSpacing: '-0.015em' },
  h3: { fontFamily: 'var(--font-heading)', fontWeight: 400 },
  h4: { fontFamily: 'var(--font-heading)', fontWeight: 400 },
  h5: { fontFamily: 'var(--font-heading)', fontWeight: 500 },
  h6: { fontFamily: 'var(--font-heading)', fontWeight: 500 },
  subtitle1: { fontWeight: 500, letterSpacing: '0.01em' },
  subtitle2: { fontWeight: 500, letterSpacing: '0.005em' },
  button: { fontWeight: 500, letterSpacing: '0.02em' },
};

// ── M3-style component overrides ───────────────────────────────────────
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        transition: 'background-color 0.2s ease, color 0.2s ease',
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
        borderRadius: 20,
        fontWeight: 500,
        letterSpacing: '0.02em',
        padding: '10px 24px',
        minHeight: 40,
      },
      contained: {
        '&:hover': {
          boxShadow: '2px 2px 0 rgba(0,0,0,0.12)',
        },
      },
      outlined: {
        borderWidth: 1,
        '&:hover': { borderWidth: 1 },
      },
    },
  },
  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: '1px solid',
        borderColor: 'var(--viraha-hairline, var(--mui-palette-outlineVariant))',
        backgroundImage: 'none',
      },
    },
  },
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        borderRadius: 16,
        backgroundImage: 'none',
      },
    },
  },
  MuiTextField: {
    defaultProps: { variant: 'outlined' as const },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': { borderRadius: 12 },
        '& .MuiFilledInput-root': { borderRadius: '12px 12px 0 0' },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 28,
        backgroundImage: 'none',
        '@media (max-width: 768px)': {
          margin: 0,
          width: '100%',
          maxWidth: '100%',
          borderRadius: '28px 28px 0 0',
          position: 'fixed' as const,
          bottom: 0,
          maxHeight: 'calc(100dvh - 64px)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8, fontWeight: 500, height: 32 },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: { borderRadius: 20, minWidth: 44, minHeight: 44 },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: { borderRadius: '28px 28px 0 0', backgroundImage: 'none' },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: '0 0 0 1px var(--viraha-hairline, rgba(34,28,24,0.15)), 3px 3px 0 rgba(0,0,0,0.12)',
        textTransform: 'none' as const,
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: { padding: 8 },
      track: { borderRadius: 16, opacity: 1 },
      thumb: { borderRadius: 16 },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: { borderRadius: 8, fontSize: '0.75rem', fontWeight: 500 },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: { borderRadius: 12, backgroundImage: 'none' },
    },
  },
  MuiAppBar: {
    defaultProps: { elevation: 0 },
    styleOverrides: { root: { backgroundImage: 'none' } },
  },
  MuiDivider: {
    styleOverrides: {
      root: { borderColor: 'var(--mui-palette-outlineVariant)' },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: { borderRadius: 28, '&.Mui-selected': { borderRadius: 28 } },
    },
  },
  MuiAlert: {
    styleOverrides: { root: { borderRadius: 12 } },
  },
  MuiSnackbar: {
    styleOverrides: {
      root: { '& .MuiPaper-root': { borderRadius: 12 } },
    },
  },
  MuiTabs: {
    styleOverrides: { indicator: { borderRadius: 3, height: 3 } },
  },
  MuiTab: {
    styleOverrides: {
      root: { textTransform: 'none' as const, fontWeight: 500, letterSpacing: '0.02em', minHeight: 48 },
    },
  },
  MuiAvatar: {
    styleOverrides: { root: { fontWeight: 500 } },
  },
  MuiBadge: {
    styleOverrides: { badge: { fontWeight: 600, fontSize: '0.65rem' } },
  },
};

// ── Single M3 theme with CSS Variables ─────────────────────────────────
export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data',
    cssVarPrefix: 'mui',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#7B68EE', light: '#A594F9', dark: '#5A4FCF', contrastText: '#FFFFFF' },
        secondary: { main: keepsake.light.gold, light: '#F5E6C4', dark: '#A58335', contrastText: '#221C18' },
        tertiary: { main: '#D4A843', light: '#F5E6C4', dark: '#A58335', contrastText: '#FFFFFF' },
        warning: { main: '#D4A843', light: '#F5E6C4' },
        error: { main: '#D32F2F', light: '#FFCDD2', dark: '#B71C1C' },
        background: { default: keepsake.light.paper, paper: keepsake.light.paperRaised },
        text: { primary: keepsake.light.ink, secondary: keepsake.light.inkMuted },
        divider: keepsake.light.hairline,
        action: {
          hover: alpha('#7B68EE', 0.08),
          selected: alpha('#7B68EE', 0.12),
          focus: alpha('#7B68EE', 0.12),
          disabled: alpha(keepsake.light.ink, 0.38),
          disabledBackground: alpha(keepsake.light.ink, 0.12),
        },
        surfaceTint: '#7B68EE',
        surfaceContainerLowest: '#FFFDF7',
        surfaceContainerLow: '#F6F0E2',
        surfaceContainer: '#F1EAD9',
        surfaceContainerHigh: '#ECE4D0',
        // surfaceContainerHighest pinned: sidebar toggle thumb must stay identical
        surfaceContainerHighest: '#E6E0EA',
        outline: '#8A8075',
        outlineVariant: '#E0D7C6',
        viraha: virahaPalette,
      },
    },
    dark: {
      palette: {
        primary: { main: '#A594F9', light: '#BDB0F7', dark: '#7B68EE', contrastText: '#1A1025' },
        secondary: { main: '#8B7CFF', light: '#A594F9', dark: '#6F5DF0', contrastText: '#0B0B0F' },
        tertiary: { main: '#8B7CFF', light: '#A594F9', dark: '#6F5DF0', contrastText: '#0B0B0F' },
        warning: { main: '#E2BC5C', light: '#F5E6C4' },
        error: { main: '#EF5350', light: '#FFCDD2', dark: '#C62828' },
        background: { default: keepsake.dark.paper, paper: keepsake.dark.paperRaised },
        text: { primary: keepsake.dark.ink, secondary: keepsake.dark.inkMuted },
        divider: keepsake.dark.hairline,
        action: {
          hover: alpha('#A594F9', 0.08),
          selected: alpha('#A594F9', 0.12),
          focus: alpha('#A594F9', 0.12),
          disabled: alpha(keepsake.dark.ink, 0.38),
          disabledBackground: alpha(keepsake.dark.ink, 0.12),
        },
        surfaceTint: '#8B7CFF',
        surfaceContainerLowest: '#0B0B0F',
        surfaceContainerLow: '#141419',
        surfaceContainer: '#1C1C24',
        surfaceContainerHigh: '#222230',
        // surfaceContainerHighest pinned: sidebar toggle thumb must stay identical
        surfaceContainerHighest: '#36343B',
        outline: '#5B5B68',
        outlineVariant: '#26262F',
        viraha: virahaPalette,
      },
    },
  },
  shape: m3Shape,
  breakpoints,
  typography,
  components,
  shadows: keepsakeShadows,
});

// Backward-compat exports
export const lightTheme = theme;
export const darkTheme = theme;
