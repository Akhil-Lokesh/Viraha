'use client';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '@/lib/theme';

export function VirahaMuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
