'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Box, Typography, IconButton, Slider } from '@mui/material';
import { motion, useReducedMotion } from 'framer-motion';
import { Play, Pause, RotateCcw, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';

interface TimelineScrubberProps {
  startDate: string | null;
  endDate: string | null;
  onDateRangeChange: (start: string | null, end: string | null) => void;
}

export function TimelineScrubber({ startDate, endDate, onDateRangeChange }: TimelineScrubberProps) {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [value, setValue] = useState<number[]>([0, 100]);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Define overall range: 5 years ago to now
  const now = useMemo(() => new Date(), []);
  const rangeStart = useMemo(() => {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 5);
    return d.getTime();
  }, [now]);
  const rangeEnd = useMemo(() => now.getTime(), [now]);
  const rangeDuration = rangeEnd - rangeStart;

  const percentToDate = useCallback((pct: number) => {
    return new Date(rangeStart + (pct / 100) * rangeDuration);
  }, [rangeStart, rangeDuration]);

  const handleChange = useCallback((_: Event, newValue: number | number[]) => {
    const vals = newValue as number[];
    setValue(vals);

    const start = percentToDate(vals[0]);
    const end = percentToDate(vals[1]);
    onDateRangeChange(start.toISOString(), end.toISOString());
  }, [percentToDate, onDateRangeChange]);

  const handleReset = useCallback(() => {
    setValue([0, 100]);
    onDateRangeChange(null, null);
    setIsPlaying(false);
    if (animationRef.current) clearInterval(animationRef.current);
  }, [onDateRangeChange]);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (animationRef.current) clearInterval(animationRef.current);
      return;
    }

    setIsPlaying(true);
    // Animate from start to end
    let currentEnd = 5;
    setValue([0, currentEnd]);
    onDateRangeChange(
      percentToDate(0).toISOString(),
      percentToDate(currentEnd).toISOString()
    );

    animationRef.current = setInterval(() => {
      currentEnd += 2;
      if (currentEnd >= 100) {
        currentEnd = 100;
        setIsPlaying(false);
        if (animationRef.current) clearInterval(animationRef.current);
      }
      setValue([0, currentEnd]);
      onDateRangeChange(
        percentToDate(0).toISOString(),
        percentToDate(currentEnd).toISOString()
      );
    }, 200);
  }, [isPlaying, percentToDate, onDateRangeChange]);

  useEffect(() => {
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, []);

  const startLabel = format(percentToDate(value[0]), 'MMM yyyy');
  const endLabel = format(percentToDate(value[1]), 'MMM yyyy');
  const isFiltered = value[0] !== 0 || value[1] !== 100;

  if (!isOpen) {
    return (
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 16, md: 24 },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
        }}
      >
        <Box
          component={motion.button}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: 'easeOut' }}
          type="button"
          onClick={() => setIsOpen(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            border: `1px solid ${CIN.hairline}`,
            borderRadius: '999px',
            bgcolor: 'rgba(20,20,25,0.92)',
            backdropFilter: 'blur(16px)',
            cursor: 'pointer',
            color: CIN.text,
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            '&:hover': {
              borderColor: 'rgba(139,124,255,0.45)',
              boxShadow: `0 0 18px ${CIN.accentGlow}`,
              color: CIN.accent,
            },
          }}
        >
          <Calendar style={{ width: 14, height: 14, color: CIN.accent }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'inherit' }}>
            Timeline
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: { xs: 16, md: 24 },
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        width: { xs: 'calc(100% - 32px)', md: 500 },
        maxWidth: '90vw',
      }}
    >
      <Box
        component={motion.div}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        sx={{
          bgcolor: 'rgba(20,20,25,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: `1px solid ${CIN.hairline}`,
          px: 2.5,
          py: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar style={{ width: 14, height: 14, color: CIN.accent }} />
            <Typography sx={{ ...eyebrowSx, fontWeight: 700 }}>
              Timeline
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pause timeline playback' : 'Play timeline'}
              sx={{
                width: 28,
                height: 28,
                color: isPlaying ? CIN.accent : CIN.textMuted,
                '&:hover': { color: CIN.accent, bgcolor: 'rgba(139,124,255,0.12)' },
              }}
            >
              {isPlaying ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14 }} />}
            </IconButton>
            <IconButton
              size="small"
              onClick={handleReset}
              disabled={!isFiltered}
              aria-label="Reset timeline"
              sx={{
                width: 28,
                height: 28,
                color: CIN.textMuted,
                '&:hover': { color: CIN.accent, bgcolor: 'rgba(139,124,255,0.12)' },
                '&.Mui-disabled': { color: 'rgba(255,255,255,0.18)' },
              }}
            >
              <RotateCcw style={{ width: 14, height: 14 }} />
            </IconButton>
            <Box
              component="button"
              type="button"
              onClick={() => {
                setIsOpen(false);
                handleReset();
              }}
              aria-label="Close timeline"
              sx={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                borderRadius: '6px',
                color: CIN.textMuted,
                transition: 'color 0.15s ease, background-color 0.15s ease',
                '&:hover': { color: CIN.text, bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </Box>
          </Box>
        </Box>

        {/* Date labels */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography suppressHydrationWarning sx={{ fontSize: '12px', fontWeight: 600, color: isFiltered ? CIN.accent : CIN.textMuted }}>
            {startLabel}
          </Typography>
          <Typography suppressHydrationWarning sx={{ fontSize: '12px', fontWeight: 600, color: isFiltered ? CIN.accent : CIN.textMuted }}>
            {endLabel}
          </Typography>
        </Box>

        {/* Slider */}
        <Slider
          value={value}
          onChange={handleChange}
          valueLabelDisplay="off"
          min={0}
          max={100}
          sx={{
            color: CIN.accent,
            height: 6,
            '& .MuiSlider-thumb': {
              width: 16,
              height: 16,
              bgcolor: CIN.accent,
              border: `2px solid ${CIN.bg}`,
              boxShadow: `0 0 10px ${CIN.accentGlow}`,
              '&:hover, &.Mui-active': { boxShadow: `0 0 0 8px rgba(139,124,255,0.16)` },
            },
            '& .MuiSlider-track': {
              border: 'none',
              boxShadow: `0 0 8px ${CIN.accentGlow}`,
            },
            '& .MuiSlider-rail': { opacity: 0.2, bgcolor: CIN.textMuted },
          }}
        />
      </Box>
    </Box>
  );
}
