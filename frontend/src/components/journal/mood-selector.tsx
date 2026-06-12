'use client';

import { Box } from '@mui/material';
import { CIN } from '@/lib/design/cinema-tokens';

const moods = [
  { value: 'adventurous', label: 'Adventurous', emoji: '🧭' },
  { value: 'peaceful', label: 'Peaceful', emoji: '🧘' },
  { value: 'exhausted', label: 'Exhausted', emoji: '😴' },
  { value: 'inspired', label: 'Inspired', emoji: '✨' },
  { value: 'reflective', label: 'Reflective', emoji: '🌙' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
];

/** Mood chips: dark surfaces with an accent ring on the selected mood. */
export function MoodSelector({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (mood: string | undefined) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {moods.map((mood) => {
        const isSelected = value === mood.value;
        return (
          <Box
            key={mood.value}
            component="button"
            type="button"
            onClick={() => onChange(isSelected ? undefined : mood.value)}
            aria-pressed={isSelected}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              borderRadius: '9999px',
              px: 1.5,
              py: 0.75,
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              border: '1px solid',
              outline: 'none',
              ...(isSelected
                ? {
                    bgcolor: 'rgba(139,124,255,0.12)',
                    color: CIN.text,
                    borderColor: CIN.accent,
                    boxShadow: `0 0 0 1px ${CIN.accent}, 0 4px 20px ${CIN.accentGlow}`,
                  }
                : {
                    bgcolor: 'var(--cin-surface-2, #1C1C24)',
                    borderColor: CIN.hairline,
                    color: CIN.textMuted,
                    '&:hover': {
                      bgcolor: 'rgba(139,124,255,0.08)',
                      borderColor: CIN.accent,
                      color: CIN.text,
                    },
                  }),
              '&:focus-visible': {
                outline: `2px solid ${CIN.accent}`,
                outlineOffset: 2,
              },
            }}
          >
            <span>{mood.emoji}</span>
            {mood.label}
          </Box>
        );
      })}
    </Box>
  );
}

/** Read-only mood chip: accent-outline microlabel. */
export function MoodBadge({ mood }: { mood: string }) {
  const found = moods.find((m) => m.value === mood);
  if (!found) return null;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        borderRadius: '6px',
        border: `1px solid ${CIN.accent}`,
        bgcolor: 'rgba(139,124,255,0.08)',
        px: 1,
        py: 0.25,
        fontFamily: 'Posterama, var(--font-body)',
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: CIN.accent,
      }}
    >
      <span>{found.emoji}</span>
      {found.label}
    </Box>
  );
}
