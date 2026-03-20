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
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'text.secondary',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          mb: 1,
        }}
      >
        Color
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {JOURNAL_COLORS.map((c: JournalColor) => {
          const isSelected = c.key === selected;
          const bg = isDark ? c.bgDark : c.bg;
          return (
            <Box
              key={c.key}
              component="button"
              onClick={() => onChange(c.key)}
              title={c.label}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: bg,
                border: isSelected ? '2px solid' : '2px solid transparent',
                borderColor: isSelected
                  ? (isDark ? c.accentDark : c.accent)
                  : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                p: 0,
                outline: 'none',
                '&:hover': {
                  transform: 'scale(1.15)',
                },
              }}
            >
              {isSelected && (
                <Check
                  style={{
                    width: 14,
                    height: 14,
                    color: isDark ? c.accentDark : c.accent,
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
