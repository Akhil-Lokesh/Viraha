'use client';

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Box, Typography, useTheme, type Theme } from '@mui/material';
import { format } from 'date-fns';
import { usePostsFeed } from '@/lib/hooks/use-posts';
import { getWidgetColorStyles } from '@/lib/dashboard/widget-colors';
import type { WidgetGridSize } from '@/lib/types/dashboard';

const DEFAULT_COLOR = '#E11D48';

type TimelineStyle = 'wave' | 'medium' | 'straight';

const STYLE_LABELS: Record<TimelineStyle, string> = {
  wave: 'Wave',
  medium: 'Medium',
  straight: 'Straight',
};

interface TripStop {
  year: string;
  location: string;
}

// ── Horizontal wave path ────────────────────────────────

function buildHorizontalWavePath(
  count: number,
  waveWidth: number,
  waveAmp: number,
  midY: number,
  startX: number,
): string {
  if (count < 2) return '';
  const segW = waveWidth / (count - 1);
  let d = `M ${startX} ${midY}`;
  for (let i = 0; i < count - 1; i++) {
    const x0 = startX + i * segW;
    const x1 = startX + (i + 1) * segW;
    const goDown = i % 2 === 0;
    const cpY = goDown ? midY + waveAmp : midY - waveAmp;
    d += ` C ${x0 + segW * 0.5} ${cpY}, ${x1 - segW * 0.5} ${cpY}, ${x1} ${midY}`;
  }
  return d;
}

// ── Vertical wave path ──────────────────────────────────

function buildVerticalWavePath(
  count: number,
  waveHeight: number,
  waveAmp: number,
  midX: number,
  startY: number,
): string {
  if (count < 2) return '';
  const segH = waveHeight / (count - 1);
  let d = `M ${midX} ${startY}`;
  for (let i = 0; i < count - 1; i++) {
    const y0 = startY + i * segH;
    const y1 = startY + (i + 1) * segH;
    const goRight = i % 2 === 0;
    const cpX = goRight ? midX + waveAmp : midX - waveAmp;
    d += ` C ${cpX} ${y0 + segH * 0.5}, ${cpX} ${y1 - segH * 0.5}, ${midX} ${y1}`;
  }
  return d;
}

// ── Persisted style ─────────────────────────────────────

function usePersistedStyle(key: string): [TimelineStyle, (s: TimelineStyle) => void] {
  const [style, setStyleState] = useState<TimelineStyle>('wave');
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored === 'wave' || stored === 'medium' || stored === 'straight') {
      setStyleState(stored);
    }
  }, [key]);
  const setStyle = useCallback((s: TimelineStyle) => {
    setStyleState(s);
    localStorage.setItem(key, s);
  }, [key]);
  return [style, setStyle];
}

// ── Widget ──────────────────────────────────────────────

export function TimelineWidget({ size, color }: { size: WidgetGridSize; color?: string }) {
  const theme = useTheme();
  const hex = color ?? DEFAULT_COLOR;
  const c = getWidgetColorStyles(hex, theme.palette.mode);

  const [style, setStyle] = usePersistedStyle('viraha-timeline-style');

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [containerH, setContainerH] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerW(entry.contentRect.width);
        setContainerH(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { data } = usePostsFeed();

  const stops: TripStop[] = useMemo(() => {
    const posts = data?.pages.flatMap((p) => p.items) ?? [];
    const seen = new Map<string, TripStop>();
    for (const post of posts) {
      const loc = post.locationCity || post.locationCountry || post.locationName;
      if (!loc) continue;
      const year = format(new Date(post.postedAt), 'yyyy');
      const key = `${loc}-${year}`;
      if (!seen.has(key)) {
        seen.set(key, { year, location: loc });
      }
    }
    return Array.from(seen.values()).reverse().slice(0, 10);
  }, [data]);

  const count = stops.length;
  // Auto-switch to vertical when the widget is in a portrait size (rows > cols)
  const isVerticalSize = size.rows > size.cols;
  const isVertical = isVerticalSize || style === 'straight';

  if (count === 0) {
    return (
      <Box sx={{ bgcolor: c.bgTint, borderRadius: '16px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>No trips to show yet</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: c.bgTint,
        borderRadius: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with style toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 0.5, flexShrink: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Timeline
        </Typography>
        {!isVerticalSize && (
          <Box sx={{ display: 'flex', gap: 0.25, bgcolor: 'action.hover', borderRadius: '8px', p: 0.25 }}>
            {(['wave', 'medium', 'straight'] as TimelineStyle[]).map((s) => (
              <Box
                key={s}
                component="button"
                onClick={() => setStyle(s)}
                sx={{
                  px: 1.25,
                  py: 0.25,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  bgcolor: style === s ? 'background.paper' : 'transparent',
                  boxShadow: style === s ? 1 : 0,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: style === s ? 'background.paper' : 'action.selected' },
                }}
              >
                <Typography sx={{ fontSize: '0.65rem', fontWeight: style === s ? 600 : 400, color: style === s ? 'text.primary' : 'text.secondary', lineHeight: 1.4 }}>
                  {STYLE_LABELS[s]}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Canvas */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          ...(isVertical && { overflowY: 'auto', overflowX: 'hidden', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }),
        }}
      >
        {containerW > 0 && (
          isVertical
            ? <VerticalTimeline stops={stops} containerW={containerW} containerH={containerH} hex={hex} strokeWidth={Math.max(Math.round(containerW / 28), 8)} dotR={Math.max(Math.round(containerW / 28), 8) / 2 + 3} yearFont={Math.max(Math.round(containerW / 16), 14)} locFont={Math.max(Math.round(containerW / 22), 11)} theme={theme} />
            : <HorizontalTimeline stops={stops} containerW={containerW} containerH={containerH} hex={hex} ampRatio={style === 'medium' ? 0.45 : 1} theme={theme} />
        )}
      </Box>
    </Box>
  );
}

// ── Horizontal (Wave / Medium) ──────────────────────────

function HorizontalTimeline({ stops, containerW, containerH, hex, ampRatio, theme }: {
  stops: TripStop[];
  containerW: number;
  containerH: number;
  hex: string;
  ampRatio: number;
  theme: Theme;
}) {
  const count = stops.length;
  const pad = 50;
  const svgW = containerW;
  const svgH = containerH;
  const midY = svgH / 2;
  const maxAmp = Math.min((svgH - 80) / 2, svgH * 0.3);
  const waveAmp = maxAmp * ampRatio;
  const startX = pad;
  const waveWidth = Math.max(svgW - pad * 2, 100);
  const strokeWidth = Math.max(Math.round(svgH / 22), 8);
  const dotR = strokeWidth / 2 + 3;
  const yearFont = Math.max(Math.round(svgH / 18), 12);
  const locFont = Math.max(Math.round(svgH / 26), 10);
  const wavePath = count >= 2 ? buildHorizontalWavePath(count, waveWidth, waveAmp, midY, startX) : '';

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: 'block', position: 'absolute', inset: 0 }}>
      {wavePath && (
        <path d={wavePath} fill="none" stroke={hex} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      )}
      {stops.map((stop, i) => {
        const segW = count > 1 ? waveWidth / (count - 1) : 0;
        const x = startX + i * segW;
        const above = i % 2 === 1;
        const dashTop = above ? midY - dotR - 2 : midY + dotR + 2;
        const dashEnd = above ? midY - waveAmp + 6 : midY + waveAmp - 6;
        const labelBaseY = above ? midY - waveAmp - 8 : midY + waveAmp + yearFont + 8;

        return (
          <g key={`h-${i}`}>
            <line x1={x} y1={dashTop} x2={x} y2={dashEnd} stroke={hex} strokeWidth={1.5} opacity={0.35} strokeDasharray="4 4" />
            <circle cx={x} cy={midY} r={dotR} fill={theme.palette.background.paper} stroke={hex} strokeWidth={2.5} />
            <circle cx={x} cy={midY} r={3.5} fill={hex} />
            <text x={x} y={above ? labelBaseY - locFont - 2 : labelBaseY} textAnchor="middle" fill={theme.palette.text.primary} fontWeight={700} fontSize={yearFont} fontFamily="inherit">{stop.year}</text>
            <text x={x} y={above ? labelBaseY + 2 : labelBaseY + locFont + 4} textAnchor="middle" fill={theme.palette.text.secondary} fontWeight={500} fontSize={locFont} fontFamily="inherit">{stop.location}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Vertical (Straight) ─────────────────────────────────

function VerticalTimeline({ stops, containerW, containerH, hex, strokeWidth, dotR, yearFont, locFont, theme }: {
  stops: TripStop[];
  containerW: number;
  containerH: number;
  hex: string;
  strokeWidth: number;
  dotR: number;
  yearFont: number;
  locFont: number;
  theme: Theme;
}) {
  const count = stops.length;
  const padY = 40;
  const segSpacing = Math.max(yearFont + locFont + 60, 90);
  const totalH = Math.max(padY * 2 + (count - 1) * segSpacing, containerH);
  const midX = containerW / 2;
  const waveAmp = containerW * 0.25;
  const startY = padY;
  const waveHeight = totalH - padY * 2;

  const wavePath = count >= 2 ? buildVerticalWavePath(count, waveHeight, waveAmp, midX, startY) : '';

  return (
    <svg width={containerW} height={totalH} viewBox={`0 0 ${containerW} ${totalH}`} style={{ display: 'block' }}>
      {wavePath && (
        <path d={wavePath} fill="none" stroke={hex} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      )}
      {stops.map((stop, i) => {
        const segH = count > 1 ? waveHeight / (count - 1) : 0;
        const y = startY + i * segH;
        const onRight = i % 2 === 1;

        const labelX = onRight ? midX + waveAmp * 0.45 + dotR + 12 : midX - waveAmp * 0.45 - dotR - 12;
        const anchor = onRight ? 'start' : 'end';

        const dashX1 = onRight ? midX + dotR + 2 : midX - dotR - 2;
        const dashX2 = onRight ? labelX - 8 : labelX + 8;

        return (
          <g key={`v-${i}`}>
            <line x1={dashX1} y1={y} x2={dashX2} y2={y} stroke={hex} strokeWidth={1.5} opacity={0.35} strokeDasharray="4 4" />
            <circle cx={midX} cy={y} r={dotR} fill={theme.palette.background.paper} stroke={hex} strokeWidth={2.5} />
            <circle cx={midX} cy={y} r={3.5} fill={hex} />
            <text x={labelX} y={y - 2} textAnchor={anchor} dominantBaseline="auto" fill={theme.palette.text.primary} fontWeight={700} fontSize={yearFont} fontFamily="inherit">{stop.year}</text>
            <text x={labelX} y={y + locFont + 4} textAnchor={anchor} dominantBaseline="auto" fill={theme.palette.text.secondary} fontWeight={500} fontSize={locFont} fontFamily="inherit">{stop.location}</text>
          </g>
        );
      })}
    </svg>
  );
}
