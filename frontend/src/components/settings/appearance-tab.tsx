'use client';

import { Box, Typography } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { CinemaCard, SectionLabel } from '@/components/cinema';
import { CIN } from '@/lib/design/cinema-tokens';
import { useThemeMode } from '@/lib/providers/mui-theme-provider';
import { settingsStagger, settingsItem } from './cinema-settings';

const THEME_OPTIONS = [
  { id: 'light' as const, label: 'Light', description: 'Clean and bright', icon: Sun },
  { id: 'dark' as const, label: 'Dark', description: 'The native experience', icon: Moon },
  { id: 'system' as const, label: 'System', description: 'Match your device', icon: Monitor },
];

export function AppearanceTab() {
  const reduceMotion = useReducedMotion();
  const { mode: theme, setMode: setTheme } = useThemeMode();

  return (
    <motion.div
      variants={settingsStagger}
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      <motion.div variants={settingsItem}>
        <CinemaCard hover={false} sx={{ p: 3 }}>
          <SectionLabel>Theme</SectionLabel>
          <Typography variant="body2" sx={{ color: CIN.textMuted, mb: 2 }}>
            Choose how Viraha looks.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
            {THEME_OPTIONS.map((t) => {
              const Icon = t.icon;
              const isActive = theme === t.id;
              return (
                <Box
                  key={t.id}
                  component={motion.button}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  aria-pressed={isActive}
                  sx={{
                    position: 'relative',
                    borderRadius: '12px',
                    border: '1px solid',
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color .2s ease, background-color .2s ease, box-shadow .2s ease',
                    bgcolor: isActive ? 'rgba(139,124,255,0.08)' : 'var(--cin-surface-2, #1C1C24)',
                    borderColor: isActive ? CIN.accent : CIN.hairline,
                    boxShadow: isActive ? `0 0 24px ${CIN.accentGlow}` : 'none',
                    ...(isActive ? {} : { '&:hover': { borderColor: 'rgba(139,124,255,0.4)' } }),
                  }}
                >
                  <Box
                    sx={{
                      mx: 'auto',
                      mb: 1,
                      display: 'flex',
                      height: 40,
                      width: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '10px',
                      transition: 'background-color .2s ease, color .2s ease',
                      ...(isActive
                        ? { bgcolor: 'rgba(139,124,255,0.14)', color: CIN.accent }
                        : { bgcolor: 'rgba(255,255,255,0.04)', color: CIN.textMuted }),
                    }}
                  >
                    <Icon style={{ height: 20, width: 20 }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: CIN.text }}>
                    {t.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: CIN.textMuted, mt: 0.25, display: 'block' }}>
                    {t.description}
                  </Typography>
                  {isActive && (
                    <Box
                      component={motion.div}
                      layoutId="theme-indicator"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: CIN.accent,
                        boxShadow: `0 0 8px ${CIN.accentGlow}`,
                      }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 300, damping: 25 }
                      }
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </CinemaCard>
      </motion.div>
    </motion.div>
  );
}
