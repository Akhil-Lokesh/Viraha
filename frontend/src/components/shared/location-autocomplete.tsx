'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import TextField from '@mui/material/TextField';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CIN } from '@/lib/design/cinema-tokens';
import { autocomplete, getPlaceDetails } from '@/lib/api/places';
import type { PlacePrediction, PlaceDetails } from '@/lib/types';

interface Props {
  onSelect: (place: PlaceDetails) => void;
  defaultValue?: string;
  placeholder?: string;
}

export function LocationAutocomplete({ onSelect, defaultValue = '', placeholder = 'Search for a place...' }: Props) {
  const [input, setInput] = useState(defaultValue);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (input.length < 2) { setPredictions([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await autocomplete(input);
        setPredictions(results);
        setOpen(results.length > 0);
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSelect(prediction: PlacePrediction) {
    setInput(prediction.description);
    setOpen(false);
    try {
      const details = await getPlaceDetails(prediction.placeId);
      onSelect(details);
    } catch { /* fallback: just use the text */ }
  }

  return (
    <Box ref={containerRef} sx={{ position: 'relative' }}>
      <Box sx={{ position: 'relative' }}>
        <MapPin
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 16,
            width: 16,
            zIndex: 1,
            color: 'var(--cin-text-muted, #9A9AA6)',
          }}
        />
        <TextField
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          variant="outlined"
          size="small"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              pl: 4.5,
              bgcolor: 'var(--cin-surface-2, #1C1C24)',
              color: 'var(--cin-text, #F4F4F6)',
              '& fieldset': { borderColor: CIN.hairline },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.16)' },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--cin-accent, #8B7CFF)',
                borderWidth: '1px',
              },
            },
            '& .MuiOutlinedInput-input::placeholder': {
              color: 'var(--cin-text-muted, #9A9AA6)',
              opacity: 1,
            },
          }}
        />
        {loading && (
          <Loader2
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              height: 16,
              width: 16,
              animation: 'spin 1s linear infinite',
              color: 'var(--cin-accent, #8B7CFF)',
            }}
          />
        )}
      </Box>
      <AnimatePresence>
        {open && predictions.length > 0 && (
          <Box
            component={motion.div}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            sx={{
              position: 'absolute',
              zIndex: 50,
              top: '100%',
              mt: 0.5,
              width: '100%',
              borderRadius: '10px',
              border: `1px solid ${CIN.hairline}`,
              bgcolor: 'var(--cin-surface-2, #1C1C24)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
              overflow: 'hidden',
            }}
          >
            {predictions.map((p) => (
              <Box
                component={motion.button}
                key={p.placeId}
                type="button"
                onClick={() => handleSelect(p)}
                whileHover={reduceMotion ? undefined : { x: 2 }}
                sx={{
                  width: '100%',
                  textAlign: 'left',
                  px: 1.5,
                  py: 1.25,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  bgcolor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '& .pin-icon': {
                    color: 'var(--cin-text-muted, #9A9AA6)',
                    transition: 'color 0.2s',
                  },
                  '&:hover': { bgcolor: 'rgba(139,124,255,0.10)' },
                  '&:hover .pin-icon': { color: 'var(--cin-accent, #8B7CFF)' },
                  '&:focus-visible': {
                    outline: 'none',
                    bgcolor: 'rgba(139,124,255,0.10)',
                  },
                  '&:not(:first-of-type)': { borderTop: `1px solid ${CIN.hairline}` },
                }}
              >
                <MapPin
                  className="pin-icon"
                  style={{
                    height: 16,
                    width: 16,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'var(--cin-text, #F4F4F6)' }}>
                    {p.mainText}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--cin-text-muted, #9A9AA6)' }}>
                    {p.secondaryText}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}
