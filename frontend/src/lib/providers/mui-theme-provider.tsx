'use client';

import { createContext, useContext, useCallback, useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  useColorScheme,
} from '@mui/material';
import type { SupportedColorScheme } from '@mui/material/styles';
import { theme } from '@/lib/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  setMode: () => {},
  resolvedMode: 'light',
});

export const useThemeMode = () => useContext(ThemeContext);

/**
 * Inner component that has access to useColorScheme()
 * (must be rendered inside ThemeProvider).
 */
function ThemeModeSync({ children }: { children: React.ReactNode }) {
  const { mode, setMode: setMuiMode, systemMode } = useColorScheme();

  const resolvedMode = (
    mode === 'system' ? (systemMode ?? 'light') : (mode ?? 'light')
  ) as 'light' | 'dark';

  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setMuiMode(newMode as SupportedColorScheme | 'system');
      localStorage.setItem('viraha-theme', newMode);
    },
    [setMuiMode],
  );

  const ctx = useMemo<ThemeContextType>(
    () => ({
      mode: (mode ?? 'system') as ThemeMode,
      setMode,
      resolvedMode,
    }),
    [mode, setMode, resolvedMode],
  );

  return (
    <ThemeContext.Provider value={ctx}>
      {children}
    </ThemeContext.Provider>
  );
}

export function VirahaMuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      theme={theme}
      defaultMode="system"
      noSsr
    >
      <CssBaseline enableColorScheme />
      <ThemeModeSync>
        {children}
      </ThemeModeSync>
    </ThemeProvider>
  );
}
