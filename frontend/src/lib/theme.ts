'use client';

import { createTheme, alpha } from '@mui/material/styles';
import type { Shadows } from '@mui/material/styles';
import { CIN } from '@/lib/design/cinema-tokens';

// ── Palette augmentation (surface/outline roles used via theme + CSS vars) ──
declare module '@mui/material/styles' {
  interface Palette {
    surfaceContainerHighest: string;
    outline: string;
    outlineVariant: string;
  }
  interface PaletteOptions {
    surfaceContainerHighest?: string;
    outline?: string;
    outlineVariant?: string;
  }
}

// Depth comes from surfaces, hairlines and the accent glow — never soft drop shadows.
const hairlineShadow = `0 0 0 1px ${CIN.hairline}`;
const shadows = ['none', ...Array.from({ length: 24 }, () => hairlineShadow)] as Shadows;

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
  h1: { fontFamily: 'var(--font-body)', fontWeight: 400, letterSpacing: '-0.025em' },
  h2: { fontFamily: 'var(--font-body)', fontWeight: 400, letterSpacing: '-0.015em' },
  h3: { fontFamily: 'var(--font-body)', fontWeight: 400 },
  h4: { fontFamily: 'var(--font-body)', fontWeight: 400 },
  h5: { fontFamily: 'var(--font-body)', fontWeight: 500 },
  h6: { fontFamily: 'var(--font-body)', fontWeight: 500 },
  subtitle1: { fontWeight: 500, letterSpacing: '0.01em' },
  subtitle2: { fontWeight: 500, letterSpacing: '0.005em' },
  button: { fontWeight: 500, letterSpacing: '0.02em' },
};

// ── M3-style component overrides ───────────────────────────────────────
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: { backgroundColor: CIN.bg },
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
        '&:hover': { boxShadow: 'none' },
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
        borderColor: CIN.hairline,
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
        boxShadow: hairlineShadow,
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

// ── Dark Cinematic: one dark theme. Photos are the light source. ──────
export const theme = createTheme({
  cssVariables: { cssVarPrefix: 'mui' },
  palette: {
    mode: 'dark',
    primary: { main: '#A594F9', light: '#BDB0F7', dark: '#7B68EE', contrastText: '#1A1025' },
    secondary: { main: CIN.accent, light: '#A594F9', dark: '#6F5DF0', contrastText: CIN.bg },
    warning: { main: '#E2BC5C', light: '#F5E6C4' },
    error: { main: '#EF5350', light: '#FFCDD2', dark: '#C62828' },
    background: { default: CIN.bg, paper: CIN.surface },
    text: { primary: CIN.text, secondary: CIN.textMuted },
    divider: CIN.hairline,
    action: {
      hover: alpha('#A594F9', 0.08),
      selected: alpha('#A594F9', 0.12),
      focus: alpha('#A594F9', 0.12),
      disabled: alpha(CIN.text, 0.38),
      disabledBackground: alpha(CIN.text, 0.12),
    },
    // Pinned: the sidebar toggle thumb reads this role.
    surfaceContainerHighest: '#36343B',
    outline: '#5B5B68',
    outlineVariant: '#26262F',
  },
  shape: m3Shape,
  breakpoints,
  typography,
  components,
  shadows,
});
