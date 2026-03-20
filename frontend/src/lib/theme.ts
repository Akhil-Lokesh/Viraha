'use client';

import { createTheme } from '@mui/material/styles';

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
  }
  interface PaletteOptions {
    viraha?: Palette['viraha'];
  }
}

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

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
        borderRadius: 12,
        fontWeight: 500,
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        '@media (max-width: 768px)': {
          margin: 0,
          width: '100%',
          maxWidth: '100%',
          borderRadius: '20px 20px 0 0',
          position: 'fixed' as const,
          bottom: 0,
          maxHeight: 'calc(100dvh - 64px)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        minWidth: 44,
        minHeight: 44,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRadius: '20px 20px 0 0',
      },
    },
  },
};

const breakpoints = {
  values: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7B68EE',
      light: '#A594F9',
      dark: '#5A4FCF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F0EBFF',
      light: '#F5F3FF',
      dark: '#DDD6FE',
      contrastText: '#6D5BD0',
    },
    warning: {
      main: '#D4A843',
      light: '#F5E6C4',
    },
    error: {
      main: '#D32F2F',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#8A8A9E',
    },
    divider: '#E8E3D8',
    viraha: virahaPalette,
  },
  shape: {
    borderRadius: 12,
  },
  breakpoints,
  typography: {
    fontFamily: 'var(--font-body)',
    h1: { fontFamily: 'var(--font-heading)' },
    h2: { fontFamily: 'var(--font-heading)' },
    h3: { fontFamily: 'var(--font-heading)' },
    h4: { fontFamily: 'var(--font-heading)' },
    h5: { fontFamily: 'var(--font-heading)' },
    h6: { fontFamily: 'var(--font-heading)' },
  },
  components: sharedComponents,
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#A594F9',
      light: '#BDB0F7',
      dark: '#7B68EE',
      contrastText: '#1A1025',
    },
    secondary: {
      main: '#2D1F4E',
      light: '#4A3D6E',
      dark: '#1A1035',
      contrastText: '#B8A4E8',
    },
    warning: {
      main: '#D4A843',
      light: '#F5E6C4',
    },
    error: {
      main: '#EF5350',
    },
    background: {
      default: '#1A1025',
      paper: '#251D35',
    },
    text: {
      primary: '#E8E3F3',
      secondary: '#8A8A9E',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
    viraha: virahaPalette,
  },
  shape: {
    borderRadius: 12,
  },
  breakpoints,
  typography: {
    fontFamily: 'var(--font-body)',
    h1: { fontFamily: 'var(--font-heading)' },
    h2: { fontFamily: 'var(--font-heading)' },
    h3: { fontFamily: 'var(--font-heading)' },
    h4: { fontFamily: 'var(--font-heading)' },
    h5: { fontFamily: 'var(--font-heading)' },
    h6: { fontFamily: 'var(--font-heading)' },
  },
  components: sharedComponents,
});
