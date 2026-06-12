'use client';

import { Box, Typography } from '@mui/material';
import { Check } from 'lucide-react';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';
import { JOURNAL_COLORS, type JournalColor } from '@/lib/stores/journal-colors-store';

interface ColorPickerProps {
  selected: string;
  onChange: (colorKey: string) => void;
}

/** Cover-color swatches: dark chips with the journal spine color, accent ring on selection. */
export function ColorPicker({ selected, onChange }: ColorPickerProps) {
  return (
    <Box>
      <Typography sx={{ ...eyebrowSx, mb: 1 }}>Cover Color</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {JOURNAL_COLORS.map((c: JournalColor) => {
          const isSelected = c.key === selected;
          return (
            <Box
              key={c.key}
              component="button"
              type="button"
              onClick={() => onChange(c.key)}
              aria-label={c.label}
              aria-pressed={isSelected}
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: c.bgDark,
                // spine sliver in the journal's accent color
                boxShadow: isSelected
                  ? `inset 3px 0 0 ${c.accentDark}, 0 0 0 2px ${CIN.accent}, 0 4px 20px ${CIN.accentGlow}`
                  : `inset 3px 0 0 ${c.accentDark}`,
                border: `1px solid ${CIN.hairline}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                p: 0,
                outline: 'none',
                '&:hover': {
                  transform: 'translateY(-2px)',
                },
                '&:focus-visible': {
                  outline: `2px solid ${CIN.accent}`,
                  outlineOffset: 2,
                },
              }}
            >
              {isSelected && (
                <Check style={{ width: 14, height: 14, color: c.accentDark }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
