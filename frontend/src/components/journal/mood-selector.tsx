'use client';

import { Box, Typography } from '@mui/material';

const moods = [
  { value: 'adventurous', label: 'Adventurous', emoji: '🧭' },
  { value: 'peaceful', label: 'Peaceful', emoji: '🧘' },
  { value: 'exhausted', label: 'Exhausted', emoji: '😴' },
  { value: 'inspired', label: 'Inspired', emoji: '✨' },
  { value: 'reflective', label: 'Reflective', emoji: '🌙' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
];

export function MoodSelector({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (mood: string | undefined) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {moods.map((mood) => (
        <Box
          key={mood.value}
          component="button"
          type="button"
          onClick={() => onChange(value === mood.value ? undefined : mood.value)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            borderRadius: '4px',
            px: 1.5,
            py: 0.75,
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            transition: 'all 0.2s',
            cursor: 'pointer',
            border: '1.5px solid',
            ...(value === mood.value
              ? {
                  bgcolor: 'rgba(212,168,67,0.12)',
                  color: 'text.primary',
                  borderColor: 'var(--viraha-gold, #D4A843)',
                  transform: 'rotate(-1.5deg)',
                }
              : {
                  bgcolor: 'background.paper',
                  borderColor: 'divider',
                  color: 'text.primary',
                  opacity: 0.8,
                  '&:hover': {
                    bgcolor: 'rgba(212,168,67,0.06)',
                    borderColor: 'var(--viraha-gold, #D4A843)',
                  },
                }),
          }}
        >
          <span>{mood.emoji}</span>
          {mood.label}
        </Box>
      ))}
    </Box>
  );
}

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
        transform: 'rotate(-2deg)',
        borderRadius: '4px',
        border: '1.5px solid var(--viraha-gold, #D4A843)',
        bgcolor: 'rgba(212,168,67,0.08)',
        px: 1,
        py: 0.25,
        fontFamily: 'var(--font-brand)',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--viraha-gold, #D4A843)',
      }}
    >
      <span>{found.emoji}</span>
      {found.label}
    </Box>
  );
}
