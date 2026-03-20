import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Color palette ───────────────────────────────────
export interface JournalColor {
  key: string;
  label: string;
  bg: string;
  bgDark: string;
  text: string;
  textDark: string;
  accent: string;
  accentDark: string;
  divider: string;
  dividerDark: string;
}

export const JOURNAL_COLORS: JournalColor[] = [
  {
    key: 'sage',
    label: 'Sage',
    bg: '#C8D5A0',
    bgDark: '#3A4228',
    text: '#2D3B1A',
    textDark: '#D0DBA8',
    accent: '#6B7A4B',
    accentDark: '#8FA060',
    divider: 'rgba(45,59,26,0.15)',
    dividerDark: 'rgba(208,219,168,0.15)',
  },
  {
    key: 'olive',
    label: 'Olive',
    bg: '#B5BD8B',
    bgDark: '#2E3320',
    text: '#333D1F',
    textDark: '#C5CC9A',
    accent: '#5C6B3A',
    accentDark: '#7A8B55',
    divider: 'rgba(51,61,31,0.15)',
    dividerDark: 'rgba(197,204,154,0.15)',
  },
  {
    key: 'gold',
    label: 'Gold',
    bg: '#E8D5A0',
    bgDark: '#3D3420',
    text: '#4A3B1A',
    textDark: '#E0D0A0',
    accent: '#8B7340',
    accentDark: '#B09858',
    divider: 'rgba(74,59,26,0.15)',
    dividerDark: 'rgba(224,208,160,0.15)',
  },
  {
    key: 'rose',
    label: 'Rose',
    bg: '#D4A8A8',
    bgDark: '#3B2228',
    text: '#3B1A1A',
    textDark: '#D4B0B0',
    accent: '#8B4A4A',
    accentDark: '#B06868',
    divider: 'rgba(59,26,26,0.15)',
    dividerDark: 'rgba(212,176,176,0.15)',
  },
  {
    key: 'lavender',
    label: 'Lavender',
    bg: '#B8A8D4',
    bgDark: '#2A2240',
    text: '#2A1A3B',
    textDark: '#C4B8D8',
    accent: '#6B4A8B',
    accentDark: '#9070B0',
    divider: 'rgba(42,26,59,0.15)',
    dividerDark: 'rgba(196,184,216,0.15)',
  },
  {
    key: 'sky',
    label: 'Sky',
    bg: '#A0C5D4',
    bgDark: '#1E2E38',
    text: '#1A2D3B',
    textDark: '#A8C8D4',
    accent: '#40708B',
    accentDark: '#5890A8',
    divider: 'rgba(26,45,59,0.15)',
    dividerDark: 'rgba(168,200,212,0.15)',
  },
  {
    key: 'sand',
    label: 'Sand',
    bg: '#D4C8A8',
    bgDark: '#383020',
    text: '#3B3018',
    textDark: '#D4C8A8',
    accent: '#8B7840',
    accentDark: '#A89558',
    divider: 'rgba(59,48,24,0.15)',
    dividerDark: 'rgba(212,200,168,0.15)',
  },
  {
    key: 'terracotta',
    label: 'Terracotta',
    bg: '#D4A888',
    bgDark: '#3B2820',
    text: '#3B2018',
    textDark: '#D4B098',
    accent: '#8B5838',
    accentDark: '#A87858',
    divider: 'rgba(59,32,24,0.15)',
    dividerDark: 'rgba(212,176,152,0.15)',
  },
];

export const DEFAULT_COLOR = 'sage';

export function getJournalColor(key: string): JournalColor {
  return JOURNAL_COLORS.find((c) => c.key === key) ?? JOURNAL_COLORS[0];
}

// ─── Store ───────────────────────────────────────────
interface JournalColorsState {
  colors: Record<string, string>; // journalId → color key
  setColor: (journalId: string, colorKey: string) => void;
  getColor: (journalId: string) => string;
}

export const useJournalColorsStore = create<JournalColorsState>()(
  persist(
    (set, get) => ({
      colors: {},
      setColor: (journalId, colorKey) =>
        set((state) => ({
          colors: { ...state.colors, [journalId]: colorKey },
        })),
      getColor: (journalId) => get().colors[journalId] ?? DEFAULT_COLOR,
    }),
    { name: 'viraha-journal-colors' }
  )
);
