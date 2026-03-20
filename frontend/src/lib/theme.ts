'use client';

import { createTheme, alpha } from '@mui/material/styles';

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
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.12)',
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
        borderColor: 'var(--mui-palette-outlineVariant)',
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
        boxShadow: '0 3px 5px -1px rgba(0,0,0,0.1), 0 6px 10px 0 rgba(0,0,0,0.07), 0 1px 18px 0 rgba(0,0,0,0.06)',
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
        secondary: { main: '#F0EBFF', light: '#F5F3FF', dark: '#DDD6FE', contrastText: '#6D5BD0' },
        tertiary: { main: '#D4A843', light: '#F5E6C4', dark: '#A58335', contrastText: '#FFFFFF' },
        warning: { main: '#D4A843', light: '#F5E6C4' },
        error: { main: '#D32F2F', light: '#FFCDD2', dark: '#B71C1C' },
        background: { default: '#FEF7FF', paper: '#FFFFFF' },
        text: { primary: '#1A1A2E', secondary: '#6E6E82' },
        divider: alpha('#7B68EE', 0.12),
        action: {
          hover: alpha('#7B68EE', 0.08),
          selected: alpha('#7B68EE', 0.12),
          focus: alpha('#7B68EE', 0.12),
          disabled: alpha('#1A1A2E', 0.38),
          disabledBackground: alpha('#1A1A2E', 0.12),
        },
        surfaceTint: '#7B68EE',
        surfaceContainerLowest: '#FFFFFF',
        surfaceContainerLow: '#F8F2FC',
        surfaceContainer: '#F2ECF6',
        surfaceContainerHigh: '#ECE6F0',
        surfaceContainerHighest: '#E6E0EA',
        outline: '#79747E',
        outlineVariant: '#CAC4D0',
        viraha: virahaPalette,
      },
    },
    dark: {
      palette: {
        primary: { main: '#A594F9', light: '#BDB0F7', dark: '#7B68EE', contrastText: '#1A1025' },
        secondary: { main: '#2D1F4E', light: '#4A3D6E', dark: '#1A1035', contrastText: '#B8A4E8' },
        tertiary: { main: '#F5E6C4', light: '#FFF3D6', dark: '#D4A843', contrastText: '#2D2A1F' },
        warning: { main: '#D4A843', light: '#F5E6C4' },
        error: { main: '#EF5350', light: '#FFCDD2', dark: '#C62828' },
        background: { default: '#141218', paper: '#1D1B20' },
        text: { primary: '#E6E0E9', secondary: '#AEA9B4' },
        divider: alpha('#CAC4D0', 0.12),
        action: {
          hover: alpha('#A594F9', 0.08),
          selected: alpha('#A594F9', 0.12),
          focus: alpha('#A594F9', 0.12),
          disabled: alpha('#E6E0E9', 0.38),
          disabledBackground: alpha('#E6E0E9', 0.12),
        },
        surfaceTint: '#A594F9',
        surfaceContainerLowest: '#0F0D13',
        surfaceContainerLow: '#1D1B20',
        surfaceContainer: '#211F26',
        surfaceContainerHigh: '#2B2930',
        surfaceContainerHighest: '#36343B',
        outline: '#938F99',
        outlineVariant: '#49454F',
        viraha: virahaPalette,
      },
    },
  },
  shape: m3Shape,
  breakpoints,
  typography,
  components,
});

// Backward-compat exports
export const lightTheme = theme;
export const darkTheme = theme;
