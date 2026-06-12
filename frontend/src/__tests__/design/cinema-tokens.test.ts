import { describe, it, expect } from 'vitest';
import { CIN, eyebrowSx, photoVignette, glowRing } from '@/lib/design/cinema-tokens';

describe('cinema-tokens', () => {
  it('exposes the core dark palette', () => {
    expect(CIN.bg).toBe('#0B0B0F');
    expect(CIN.accent).toBe('#8B7CFF');
    expect(CIN.surface).toBe('#141419');
  });

  it('eyebrow mixin is uppercase + tracked', () => {
    const sx = eyebrowSx as Record<string, unknown>;
    expect(sx.textTransform).toBe('uppercase');
    expect(String(sx.letterSpacing)).toMatch(/em|px|\d/);
  });

  it('vignette is a gradient string', () => {
    expect(photoVignette).toContain('gradient');
  });

  it('glowRing embeds the accent var', () => {
    expect(glowRing()).toContain('--cin-accent');
  });
});
