'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Box, Typography, IconButton, Slider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Play, Pause, RotateCcw, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineScrubberProps {
  startDate: string | null;
  endDate: string | null;
  onDateRangeChange: (start: string | null, end: string | null) => void;
}

export function TimelineScrubber({ startDate, endDate, onDateRangeChange }: TimelineScrubberProps) {
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
          component="button"
          onClick={() => setIsOpen(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            border: 1,
            borderColor: 'divider',
            borderRadius: '12px',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(31,21,48,0.9)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(16px)',
            boxShadow: 2,
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { boxShadow: 4 },
          }}
        >
          <Calendar style={{ width: 14, height: 14 }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.primary' }}>
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
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(31,21,48,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: 1,
          borderColor: 'divider',
          boxShadow: 4,
          px: 2.5,
          py: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar style={{ width: 14, height: 14, opacity: 0.6 }} />
            <Typography sx={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
              Timeline
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleTogglePlay}
              sx={{ width: 28, height: 28 }}
            >
              {isPlaying ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14 }} />}
            </IconButton>
            <IconButton
              size="small"
              onClick={handleReset}
              disabled={!isFiltered}
              sx={{ width: 28, height: 28 }}
            >
              <RotateCcw style={{ width: 14, height: 14 }} />
            </IconButton>
            <Box
              component="button"
              onClick={() => {
                setIsOpen(false);
                handleReset();
              }}
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
                fontSize: '16px',
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              ×
            </Box>
          </Box>
        </Box>

        {/* Date labels */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: isFiltered ? 'primary.main' : 'text.secondary' }}>
            {startLabel}
          </Typography>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: isFiltered ? 'primary.main' : 'text.secondary' }}>
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
            color: 'primary.main',
            height: 6,
            '& .MuiSlider-thumb': {
              width: 16,
              height: 16,
              '&:hover, &.Mui-active': { boxShadow: '0 0 0 8px rgba(128,90,213,0.16)' },
            },
            '& .MuiSlider-rail': { opacity: 0.2 },
          }}
        />
      </Box>
    </Box>
  );
}
