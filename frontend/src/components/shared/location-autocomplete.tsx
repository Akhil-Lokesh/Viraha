'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import TextField from '@mui/material/TextField';
import { Box, Typography } from '@mui/material';
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
            color: 'var(--mui-palette-text-secondary)',
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
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, pl: 4.5 } }}
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
              color: 'var(--mui-palette-text-secondary)',
            }}
          />
        )}
      </Box>
      {open && predictions.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 50,
            top: '100%',
            mt: 0.5,
            width: '100%',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            boxShadow: 3,
            overflow: 'hidden',
          }}
        >
          {predictions.map((p) => (
            <Box
              component="button"
              key={p.placeId}
              type="button"
              onClick={() => handleSelect(p)}
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
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <MapPin
                style={{
                  height: 16,
                  width: 16,
                  flexShrink: 0,
                  marginTop: 2,
                  color: 'var(--mui-palette-text-secondary)',
                }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                  {p.mainText}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {p.secondaryText}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
