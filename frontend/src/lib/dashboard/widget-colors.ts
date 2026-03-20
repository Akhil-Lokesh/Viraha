import { alpha } from '@mui/material/styles';

export function getWidgetColorStyles(hex: string, mode: 'light' | 'dark') {
  return {
    bgTint: mode === 'dark' ? alpha(hex, 0.15) : alpha(hex, 0.06),
    iconBg: mode === 'dark' ? alpha(hex, 0.25) : alpha(hex, 0.12),
    accent: hex,
  };
}
