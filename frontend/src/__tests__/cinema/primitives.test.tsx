import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PhotoTile } from '@/components/cinema/photo-tile';
import { CinemaCard } from '@/components/cinema/cinema-card';
import { GlowButton } from '@/components/cinema/glow-button';
import { StatPill } from '@/components/cinema/stat-pill';
import { SectionLabel } from '@/components/cinema/section-label';

describe('cinema primitives', () => {
  it('PhotoTile renders an img with alt when src present', () => {
    const html = renderToString(<PhotoTile src="https://x/y.jpg" alt="Paris" />);
    expect(html).toContain('Paris');
    expect(html).toContain('<img');
  });

  it('PhotoTile renders a fallback (no img) when src is empty', () => {
    const html = renderToString(<PhotoTile src="" alt="none" />);
    expect(html).not.toContain('<img');
    expect(html).toContain('none');
  });

  it('PhotoTile resolves relative /uploads paths to the API origin', () => {
    const html = renderToString(<PhotoTile src="/uploads/images/a.webp" alt="up" />);
    expect(html).toContain('4000/uploads/images/a.webp');
  });

  it('StatPill shows value + label', () => {
    const html = renderToString(<StatPill value={12} label="Countries" />);
    expect(html).toContain('12');
    expect(html).toContain('Countries');
  });

  it('SectionLabel renders its text', () => {
    expect(renderToString(<SectionLabel>Recent</SectionLabel>)).toContain('Recent');
  });

  it('GlowButton renders children', () => {
    expect(renderToString(<GlowButton>Go</GlowButton>)).toContain('Go');
  });

  it('CinemaCard renders children', () => {
    expect(renderToString(<CinemaCard>hi</CinemaCard>)).toContain('hi');
  });
});
