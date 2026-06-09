'use client';

import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Check } from 'lucide-react';
import { JOURNAL_COLORS, type JournalColor } from '@/lib/stores/journal-colors-store';

interface ColorPickerProps {
  selected: string;
  onChange: (colorKey: string) => void;
}

export function ColorPicker({ selected, onChange }: ColorPickerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box>
      <Typography
        sx={{
          fontFamily: 'var(--font-brand)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--viraha-gold, #D4A843)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          mb: 1,
        }}
      >
        Cover Color
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {JOURNAL_COLORS.map((c: JournalColor) => {
          const isSelected = c.key === selected;
          const bg = isDark ? c.bgDark : c.bg;
          const accent = isDark ? c.accentDark : c.accent;
          return (
            <Box
              key={c.key}
              component="button"
              onClick={() => onChange(c.key)}
              aria-label={c.label}
              sx={{
                width: 30,
                height: 38,
                // tiny book: tight spine edge, rounded fore-edge
                borderRadius: '2px 6px 6px 2px',
                bgcolor: bg,
                // spine band rendered as an inset edge
                boxShadow: `inset 5px 0 0 ${accent}55`,
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'var(--viraha-gold, #D4A843)' : `${accent}44`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                p: 0,
                outline: 'none',
                '&:hover': {
                  transform: 'translateY(-2px) rotate(-2deg)',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              {isSelected && (
                <Check
                  style={{
                    width: 14,
                    height: 14,
                    color: accent,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
