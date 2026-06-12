# Viraha Dark Cinematic Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Viraha's light "Keepsake" UI with a cohesive **dark cinematic** design across every surface except the menubar, and make the app feel **alive** (seeded content, onboarding, real empty states), verified by actually looking at every screen in a browser.

**Architecture:** One shared design-token module + a small set of reusable primitives (`PhotoTile`, `CinemaCard`, `GlowButton`, `StatPill`, `SectionLabel`, dark `EmptyState`) that every page composes. The MUI theme's **dark** color scheme is rewritten to the cinematic palette and the app is pinned to dark mode. Aliveness comes from running/extending the existing `backend/prisma/seed.ts`, adding first-run onboarding, and replacing blank states. A Playwright screenshot harness is the acceptance gate.

**Tech Stack:** Next.js 14 (App Router) · MUI v7 · Framer Motion · TanStack Query v5 · Zustand · Express 5 + Prisma + PostGIS · Playwright (verification only).

---

## Conventions for every task

- **Never edit** `frontend/src/components/layout/sidebar.tsx` or `frontend/src/components/layout/mobile-nav.tsx`.
- All colors come from the tokens in **Task 2** via `var(--cin-*)` CSS variables (with hex fallbacks) or `theme.palette`. No new hardcoded hexes in page files.
- No `any`. No `console.log` in committed app code. Keep all existing data wiring, a11y attributes, loading/empty/error states (restyle, don't delete).
- After any frontend TS edit, if `tsc` shows `Duplicate identifier` from `.next`, run: `find frontend/.next -name "* 2.*" -delete`.
- Run dev servers (already documented): backend `:4000` (CORS `http://localhost:3002`), frontend `:3002`, Docker PostGIS on `:5433`, Redis `:6379`.

---

## Pre-flight: instant aliveness (run the existing seed)

**Why:** `backend/prisma/seed.ts` already creates demo users, posts with absolute Unsplash URLs, comments, saves, albums, and journals — it was never run against the dev DB. This alone fixes most of "feels dead."

- [ ] **Step 1: Run the seed against the dev DB**

```bash
cd backend
DATABASE_URL=postgresql://viraha:viraha_dev_password@localhost:5433/viraha_dev npx ts-node prisma/seed.ts
```
Expected: `🌱 Seeding…` then `✓ Created N users/posts/albums/journals`, exit 0.

- [ ] **Step 2: Verify content is now reachable over the API**

```bash
curl -s http://localhost:4000/api/v1/posts/ | python3 -c 'import sys,json;d=json.load(sys.stdin);print("posts:",len(d["data"]["posts"]))'
```
Expected: `posts: 20`+ (non-zero). If zero, read the seed output for errors before continuing.

- [ ] **Step 3: Capture the seeded demo login** — open `backend/prisma/seed.ts`, find the demo user's email + password (search `demo`), and record them; the verification harness (Task 20) logs in as this user.

---

## File structure map

**New (foundation):**
- `frontend/src/lib/design/cinema-tokens.ts` — token constants + shared `sx` mixins (single source of truth).
- `frontend/src/components/cinema/photo-tile.tsx` — full-bleed image w/ vignette, shimmer, tasteful broken-image fallback.
- `frontend/src/components/cinema/cinema-card.tsx` — surface + hairline + hover glow container.
- `frontend/src/components/cinema/glow-button.tsx` — primary/ghost accent button.
- `frontend/src/components/cinema/stat-pill.tsx` — number + label chip.
- `frontend/src/components/cinema/section-label.tsx` — muted uppercase eyebrow.
- `frontend/src/components/cinema/index.ts` — barrel export.
- `frontend/src/components/onboarding/first-run.tsx` — first-run welcome/onboarding.
- `frontend/scripts/visual-check.cjs` — Playwright screenshot harness (Wave C).

**Modified (foundation):**
- `frontend/src/app/globals.css` — add `--cin-*` variables; pin dark scheme.
- `frontend/src/lib/theme.ts` — rewrite the **dark** color scheme to cinematic; keep `primary` purple for the sidebar.
- `frontend/src/lib/providers/mui-theme-provider.tsx` (or `theme-provider.tsx`) — force `defaultMode="dark"`.
- `frontend/src/components/shared/empty-state.tsx` — dark cinematic variant (same props API).

**Modified (pages, Wave B — one owner each):** `app/(app)/home/**`, `explore/**`, `post/[id]/**`, `profile/[username]/**`, `albums/**`, `journals/**`, `atlas/**`, `map/**`, `saved/**`, `activity/**`, `settings/**`, `create/**`, `app/(auth)/**`, plus their feature components under `components/post`, `components/album`, `components/journal`, `components/user`, `components/dashboard`, `components/activity`, `components/settings`.

---

## Wave A — Foundation

### Task 1: Pin the app to dark mode

**Files:**
- Modify: `frontend/src/lib/providers/mui-theme-provider.tsx`

- [ ] **Step 1: Find how the provider sets color scheme**

Run: `grep -nE "defaultMode|colorScheme|CssVarsProvider|ThemeProvider|useColorScheme" frontend/src/lib/providers/mui-theme-provider.tsx`
Expected: a provider wrapping children with the theme from `lib/theme.ts`.

- [ ] **Step 2: Force dark as the default and disable system switching**

In the provider, set the MUI theme provider's `defaultMode="dark"` (for `Experimental_CssVarsProvider`/`ThemeProvider` use `defaultMode` / `forceThemeRerender`); if the app reads a persisted theme from settings, default it to `'dark'`. Leave the settings theme toggle in place but default to dark.

```tsx
// inside the provider's JSX, on the MUI theme/CssVars provider:
<ThemeProvider theme={theme} defaultMode="dark">
```

- [ ] **Step 3: Verify** — Run: `cd frontend && npx tsc --noEmit` → no new errors. Load `http://localhost:3002/sign-in` in the harness later; background must be near-black.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/providers/mui-theme-provider.tsx
git commit -m "feat(theme): pin app to dark mode for cinematic redesign"
```

---

### Task 2: Cinematic design tokens (single source of truth)

**Files:**
- Create: `frontend/src/lib/design/cinema-tokens.ts`
- Test: `frontend/src/__tests__/design/cinema-tokens.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { CIN, eyebrowSx, photoVignette } from '@/lib/design/cinema-tokens';

describe('cinema-tokens', () => {
  it('exposes the core dark palette', () => {
    expect(CIN.bg).toBe('#0B0B0F');
    expect(CIN.accent).toBe('#8B7CFF');
  });
  it('eyebrow mixin is uppercase + tracked', () => {
    expect(eyebrowSx.textTransform).toBe('uppercase');
    expect(String(eyebrowSx.letterSpacing)).toMatch(/em|px|\d/);
  });
  it('vignette is a gradient string', () => {
    expect(photoVignette).toContain('gradient');
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — Run: `cd frontend && npx vitest run src/__tests__/design/cinema-tokens.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement the tokens**

```ts
// frontend/src/lib/design/cinema-tokens.ts
import type { SxProps, Theme } from '@mui/material';

/** Dark-cinematic palette. CSS-var names mirror these (see globals.css). */
export const CIN = {
  bg: '#0B0B0F',
  surface: '#141419',
  surface2: '#1C1C24',
  hairline: 'rgba(255,255,255,0.08)',
  text: '#F4F4F6',
  textMuted: '#9A9AA6',
  accent: '#8B7CFF',
  accentGlow: 'rgba(139,124,255,0.35)',
  danger: '#FF6B6B',
} as const;

/** Muted uppercase eyebrow/section label. */
export const eyebrowSx: SxProps<Theme> = {
  fontFamily: 'Posterama, var(--font-body)',
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  fontSize: 11,
  color: 'var(--cin-text-muted, #9A9AA6)',
};

/** Large display heading. */
export const displaySx: SxProps<Theme> = {
  fontFamily: 'Posterama, var(--font-body)',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: 'var(--cin-text, #F4F4F6)',
  lineHeight: 1.02,
};

/** Bottom-weighted vignette so captions stay legible over photos. */
export const photoVignette =
  'linear-gradient(to top, rgba(11,11,15,0.85) 0%, rgba(11,11,15,0.15) 45%, rgba(11,11,15,0) 70%)';

/** Hover-glow ring used on interactive photo/cards. */
export const glowRing = (px = 1) =>
  `0 0 0 ${px}px var(--cin-accent, #8B7CFF), 0 8px 40px var(--cin-accent-glow, rgba(139,124,255,0.35))`;
```

- [ ] **Step 4: Run the test, expect PASS** — Run: `cd frontend && npx vitest run src/__tests__/design/cinema-tokens.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/design/cinema-tokens.ts frontend/src/__tests__/design/cinema-tokens.test.ts
git commit -m "feat(design): cinematic token module + mixins"
```

---

### Task 3: CSS variables + dark theme palette

**Files:**
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/lib/theme.ts`

- [ ] **Step 1: Add `--cin-*` variables to globals.css**

Add, inside the existing dark scheme block (`[data-mui-color-scheme='dark'], .dark { … }`) and `:root` as fallback:

```css
:root,
[data-mui-color-scheme='dark'],
.dark {
  --cin-bg: #0B0B0F;
  --cin-surface: #141419;
  --cin-surface-2: #1C1C24;
  --cin-hairline: rgba(255, 255, 255, 0.08);
  --cin-text: #F4F4F6;
  --cin-text-muted: #9A9AA6;
  --cin-accent: #8B7CFF;
  --cin-accent-glow: rgba(139, 124, 255, 0.35);
  --cin-danger: #FF6B6B;
}
/* App background is the dark room. */
body { background: var(--cin-bg, #0B0B0F); color: var(--cin-text, #F4F4F6); }
```

- [ ] **Step 2: Rewrite the dark palette in theme.ts**

In `theme.ts` `colorSchemes.dark.palette`, set (keep `primary` purple so the sidebar is unchanged):

```ts
background: { default: '#0B0B0F', paper: '#141419' },
text: { primary: '#F4F4F6', secondary: '#9A9AA6' },
divider: 'rgba(255,255,255,0.08)',
secondary: { main: '#8B7CFF', light: '#A594F9', dark: '#6F5DF0', contrastText: '#0B0B0F' },
tertiary:  { main: '#8B7CFF', light: '#A594F9', dark: '#6F5DF0', contrastText: '#0B0B0F' },
```
Leave `primary: { main: '#A594F9' … }` as-is (sidebar/active states). Set `surfaceContainerLowest:'#0B0B0F'`, `surfaceContainerLow:'#141419'`, `surfaceContainer*:'#1C1C24'` upward, **except** the one container token the sidebar thumb uses (keep it as it was — grep `surfaceContainerHighest` usage in sidebar first to confirm which, and leave that value untouched).

- [ ] **Step 3: Remove ambient shadows** — in the theme `shadows` array / component overrides, ensure cards use `border: 1px solid var(--cin-hairline)` and no soft drop shadow (`boxShadow: 'none'` baseline; glow is applied per-component).

- [ ] **Step 4: Verify** — Run: `cd frontend && npx tsc --noEmit && npx vitest run` → green. Then `npx next build 2>&1 | tail -3` → success.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/globals.css frontend/src/lib/theme.ts
git commit -m "feat(theme): dark cinematic palette + css variables"
```

---

### Task 4: `PhotoTile` primitive

**Files:**
- Create: `frontend/src/components/cinema/photo-tile.tsx`
- Test: `frontend/src/__tests__/cinema/photo-tile.test.tsx`

- [ ] **Step 1: Write the failing test** (renders, applies alt, falls back when src empty)

```tsx
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PhotoTile } from '@/components/cinema/photo-tile';

describe('PhotoTile', () => {
  it('renders an img with alt when src present', () => {
    const html = renderToString(<PhotoTile src="https://x/y.jpg" alt="Paris" />);
    expect(html).toContain('Paris');
  });
  it('renders a fallback (no img) when src is empty', () => {
    const html = renderToString(<PhotoTile src="" alt="none" />);
    expect(html).not.toContain('<img');
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — `cd frontend && npx vitest run src/__tests__/cinema/photo-tile.test.tsx`.

- [ ] **Step 3: Implement**

```tsx
'use client';
import { Box, type SxProps, type Theme } from '@mui/material';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { CIN, photoVignette } from '@/lib/design/cinema-tokens';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
function resolve(url: string): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

interface PhotoTileProps {
  src: string;
  alt: string;
  /** Apply the bottom vignette for caption legibility. */
  vignette?: boolean;
  rounded?: number;
  sx?: SxProps<Theme>;
  children?: React.ReactNode; // overlay content (captions, stamps)
}

export function PhotoTile({ src, alt, vignette = true, rounded = 14, sx, children }: PhotoTileProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolve(src);
  const showImg = !!resolved && !failed;
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: `${rounded}px`,
      bgcolor: CIN.surface2, ...sx }}>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolved} alt={alt} onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <Box aria-label={alt} role="img" sx={{ width: '100%', height: '100%', minHeight: 160,
          display: 'grid', placeItems: 'center', color: CIN.textMuted,
          background: `repeating-linear-gradient(45deg, ${CIN.surface}, ${CIN.surface} 12px, ${CIN.surface2} 12px, ${CIN.surface2} 24px)` }}>
          <ImageOff size={28} />
        </Box>
      )}
      {vignette && showImg && (
        <Box sx={{ position: 'absolute', inset: 0, background: photoVignette, pointerEvents: 'none' }} />
      )}
      {children && <Box sx={{ position: 'absolute', inset: 0 }}>{children}</Box>}
    </Box>
  );
}
```

- [ ] **Step 4: Run the test, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/cinema/photo-tile.tsx frontend/src/__tests__/cinema/photo-tile.test.tsx
git commit -m "feat(cinema): PhotoTile primitive with vignette + graceful fallback"
```

---

### Task 5: `CinemaCard`, `GlowButton`, `StatPill`, `SectionLabel` + barrel

**Files:**
- Create: `frontend/src/components/cinema/cinema-card.tsx`, `glow-button.tsx`, `stat-pill.tsx`, `section-label.tsx`, `index.ts`
- Test: `frontend/src/__tests__/cinema/primitives.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { CinemaCard, GlowButton, StatPill, SectionLabel } from '@/components/cinema';

describe('cinema primitives', () => {
  it('StatPill shows value + label', () => {
    const html = renderToString(<StatPill value={12} label="Countries" />);
    expect(html).toContain('12'); expect(html).toContain('Countries');
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
```

- [ ] **Step 2: Run it, expect FAIL.**

- [ ] **Step 3: Implement each**

```tsx
// cinema-card.tsx
'use client';
import { Box, type SxProps, type Theme } from '@mui/material';
import { CIN, glowRing } from '@/lib/design/cinema-tokens';
export function CinemaCard({ children, hover = true, sx }:
  { children: React.ReactNode; hover?: boolean; sx?: SxProps<Theme> }) {
  return (
    <Box sx={{ bgcolor: 'var(--cin-surface, #141419)', border: `1px solid ${CIN.hairline}`,
      borderRadius: '16px', overflow: 'hidden', transition: 'box-shadow .2s, transform .2s',
      ...(hover && { '&:hover': { boxShadow: glowRing(1), transform: 'translateY(-2px)' } }), ...sx }}>
      {children}
    </Box>
  );
}
```

```tsx
// glow-button.tsx
'use client';
import { Button, type ButtonProps } from '@mui/material';
import { CIN, glowRing } from '@/lib/design/cinema-tokens';
export function GlowButton({ variant = 'solid', sx, ...rest }:
  Omit<ButtonProps, 'variant'> & { variant?: 'solid' | 'ghost' }) {
  const solid = variant === 'solid';
  return (
    <Button disableElevation {...rest} sx={{
      textTransform: 'none', fontWeight: 600, borderRadius: '10px', px: 2.5, py: 1,
      bgcolor: solid ? CIN.accent : 'transparent',
      color: solid ? '#0B0B0F' : CIN.text,
      border: solid ? 'none' : `1px solid ${CIN.hairline}`,
      '&:hover': { bgcolor: solid ? CIN.accent : 'rgba(255,255,255,0.04)', boxShadow: solid ? glowRing(0) : 'none' },
      ...sx }} />
  );
}
```

```tsx
// stat-pill.tsx
'use client';
import { Box, Typography } from '@mui/material';
import { CIN, eyebrowSx } from '@/lib/design/cinema-tokens';
export function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <Box sx={{ px: 2, py: 1.25, borderRadius: '12px', bgcolor: CIN.surface,
      border: `1px solid ${CIN.hairline}`, minWidth: 92 }}>
      <Typography sx={{ fontFamily: 'Posterama, var(--font-body)', fontWeight: 700, fontSize: 24,
        color: CIN.text, lineHeight: 1 }}>{value}</Typography>
      <Typography sx={{ ...eyebrowSx, mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}
```

```tsx
// section-label.tsx
'use client';
import { Typography } from '@mui/material';
import { eyebrowSx } from '@/lib/design/cinema-tokens';
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Typography component="h2" sx={{ ...eyebrowSx, mb: 1.5 }}>{children}</Typography>;
}
```

```ts
// index.ts
export { PhotoTile } from './photo-tile';
export { CinemaCard } from './cinema-card';
export { GlowButton } from './glow-button';
export { StatPill } from './stat-pill';
export { SectionLabel } from './section-label';
```

- [ ] **Step 4: Run the test, expect PASS.**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/cinema frontend/src/__tests__/cinema/primitives.test.tsx
git commit -m "feat(cinema): CinemaCard, GlowButton, StatPill, SectionLabel primitives"
```

---

### Task 6: Dark `EmptyState` (same props API)

**Files:**
- Modify: `frontend/src/components/shared/empty-state.tsx`

- [ ] **Step 1: Confirm current props** — Run: `grep -nE "interface|Props|icon|title|description|actionLabel|actionHref" frontend/src/components/shared/empty-state.tsx`. Keep the exact same prop names.

- [ ] **Step 2: Restyle to dark cinematic** — dark surface, a subtle accent-glow halo behind the icon, `SectionLabel`-style eyebrow, `GlowButton` CTA. No paper/stamp motifs. Representative body:

```tsx
<Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
  <Box sx={{ width: 88, height: 88, mx: 'auto', mb: 3, borderRadius: '50%',
    display: 'grid', placeItems: 'center', color: 'var(--cin-accent,#8B7CFF)',
    bgcolor: 'var(--cin-surface,#141419)', border: '1px solid var(--cin-hairline,rgba(255,255,255,.08))',
    boxShadow: '0 0 60px var(--cin-accent-glow,rgba(139,124,255,.35))' }}>
    {icon}
  </Box>
  <Typography sx={{ fontFamily: 'Posterama, var(--font-body)', fontWeight: 700, fontSize: 22, color: 'var(--cin-text,#F4F4F6)' }}>{title}</Typography>
  {description && <Typography sx={{ color: 'var(--cin-text-muted,#9A9AA6)', mt: 1, maxWidth: 420, mx: 'auto' }}>{description}</Typography>}
  {actionLabel && actionHref && (
    <GlowButton component={Link} href={actionHref} sx={{ mt: 3 }}>{actionLabel}</GlowButton>
  )}
</Box>
```

- [ ] **Step 3: Verify** — `cd frontend && npx tsc --noEmit && npx vitest run` → green.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/shared/empty-state.tsx
git commit -m "feat(cinema): dark EmptyState variant (props API unchanged)"
```

---

### Task 7: First-run onboarding

**Files:**
- Create: `frontend/src/components/onboarding/first-run.tsx`
- Modify: `frontend/src/app/(app)/layout.tsx` (mount it once, like `ActivityStreamMount`)

- [ ] **Step 1: Build a dismissible welcome overlay** — shows once per user (persist `viraha-onboarded:<userId>` in localStorage). Three quick cards: "Post your first memory" → `/create/post`, "Explore the map" → `/map`, "Find people" → `/explore`. Uses `CinemaCard` + `GlowButton`. Skippable. Does not block the UI; renders `null` once dismissed/seen.

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Box, Modal, Typography } from '@mui/material';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { CinemaCard, GlowButton, SectionLabel } from '@/components/cinema';

export function FirstRun() {
  const userId = useAuthStore((s) => s.user?.id);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!userId) return;
    const key = `viraha-onboarded:${userId}`;
    if (!localStorage.getItem(key)) setOpen(true);
  }, [userId]);
  const dismiss = () => {
    if (userId) localStorage.setItem(`viraha-onboarded:${userId}`, '1');
    setOpen(false);
  };
  if (!userId) return null;
  return (
    <Modal open={open} onClose={dismiss} aria-labelledby="welcome">
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(560px, 92vw)', bgcolor: 'var(--cin-surface,#141419)', borderRadius: '18px',
        border: '1px solid var(--cin-hairline,rgba(255,255,255,.08))', p: 4, outline: 'none' }}>
        <SectionLabel>Welcome to Viraha</SectionLabel>
        <Typography id="welcome" sx={{ fontFamily: 'Posterama, var(--font-body)', fontWeight: 700, fontSize: 26, mb: 3 }}>
          Three ways to start
        </Typography>
        {[
          { t: 'Post your first memory', href: '/create/post' },
          { t: 'Explore the world map', href: '/map' },
          { t: 'Find fellow travelers', href: '/explore' },
        ].map((c) => (
          <CinemaCard key={c.href} sx={{ p: 2, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: 'var(--cin-text,#F4F4F6)' }}>{c.t}</Typography>
            <GlowButton component={Link} href={c.href} onClick={dismiss}>Go</GlowButton>
          </CinemaCard>
        ))}
        <Box sx={{ textAlign: 'right', mt: 1 }}>
          <GlowButton variant="ghost" onClick={dismiss}>Skip for now</GlowButton>
        </Box>
      </Box>
    </Modal>
  );
}
```

- [ ] **Step 2: Mount in the app layout** — add `<FirstRun />` next to `<ActivityStreamMount />` in `frontend/src/app/(app)/layout.tsx`.

- [ ] **Step 3: Verify** — `cd frontend && npx tsc --noEmit && npx vitest run` → green.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/onboarding/first-run.tsx "frontend/src/app/(app)/layout.tsx"
git commit -m "feat(onboarding): dismissible first-run welcome"
```

---

## Wave B — Page redesigns (parallel-safe; one owner per area)

> Each task: apply Dark Cinematic using Wave-A primitives/tokens. Keep ALL data wiring, handlers, a11y, and loading/empty/error states (restyle). PostCard and other shared components keep backward-compatible props. Acceptance = the page screenshots (Wave C) read as intentional dark cinematic, populated (seed data), with photos full-bleed and the accent used sparingly.

### Task 8: PostCard (flagship) + post detail
**Files:** `frontend/src/components/post/post-card.tsx`, `post-detail.tsx`, `post-grid.tsx`, `app/(app)/post/[id]/page.tsx`
- [ ] Replace paper/stamp treatment: `PhotoTile` for media (full-bleed, vignette), caption + location over the vignette, author row with avatar, quiet action row (save/comment/share) with accent on active. Coordinates as muted `eyebrowSx` microtext; when lat/lng are null but city present, show a muted "Approximate location" label (no map affordance). Detail page: large hero `PhotoTile`, comments in a side column on desktop, hairline divider. Keep lightbox, save optimism, report dialog, infinite scroll.
- [ ] Verify `cd frontend && npx tsc --noEmit && npx vitest run`. Commit: `feat(cinema): redesign PostCard + post detail`.

### Task 9: Home (journal spread → cinematic dashboard)
**Files:** `app/(app)/home/**`, `components/dashboard/**`
- [ ] Greeting (`displaySx`) + muted eyebrow (date · travel mode). Hero = `HeroMemory` (already shows the user's own latest via `useMyPosts`) rendered with `PhotoTile` + vignette caption. Stats as `StatPill` row (countries/cities/memories from `useAtlas`). Recent grid using `PhotoTile` tiles with hover glow. Keep widget edit-mode behind its toggle; consolidate presentation, keep all widget data reachable. Empty hero → dark `EmptyState` CTA "Post your first memory".
- [ ] Verify + commit: `feat(cinema): redesign home dashboard`.

### Task 10: Explore + feed
**Files:** `app/(app)/explore/**`
- [ ] Full-width single `PostCard` column; map panel as a dark side rail on xl (lazy-loaded, as already done). Trending locations as a horizontal rail of small `PhotoTile`s with labels. Search as a dark inset field. Keep tabs/feed modes, block-visibility, infinite scroll.
- [ ] Verify + commit: `feat(cinema): redesign explore + feed`.

### Task 11: Profile
**Files:** `app/(app)/profile/[username]/**`, `components/user/user-profile-header.tsx`
- [ ] Cover = full-bleed `PhotoTile` (latest post or avatar) with vignette; name in `displaySx`, @handle in `eyebrowSx`; follower/following/posts as `StatPill`s. Tabs as accent-underlined dark tabs. Keep follow/unfollow (+request states), block dialog (already converted from window.confirm — keep), report, mute item. Use `PostCard` as-is in the grid.
- [ ] Verify + commit: `feat(cinema): redesign profile`.

### Task 12: Albums (+ detail/edit)
**Files:** `app/(app)/albums/**`, `components/album/**`
- [ ] Album cards = `CinemaCard` wrapping a `PhotoTile` cover with title + count `StatPill`; remove photo-stack/paper motif. Detail = editorial dark grid of `PhotoTile`s (hero + supporting). Keep create/edit/delete, infinite scroll.
- [ ] Verify + commit: `feat(cinema): redesign albums`.

### Task 13: Journals (+ detail/entry editor chrome)
**Files:** `app/(app)/journals/**`, `components/journal/**`
- [ ] Journal cards = `CinemaCard` with the per-journal custom color as a thin accent spine/border (not a cloth book). Detail entries = dark reading layout, `eyebrowSx` dates, hairline dividers. Restyle editor chrome only (toolbar active states in accent); do not touch TipTap internals. Keep create/edit/publish, color picker, mood.
- [ ] Verify + commit: `feat(cinema): redesign journals`.

### Task 14: Atlas
**Files:** `app/(app)/atlas/**`
- [ ] Big `displaySx` numbers for countries/cities/continents; continent progress as dark bars with accent fill; travel-style as an accent chip. Remove passport/stamp motif. Keep all data + retry/error.
- [ ] Verify + commit: `feat(cinema): redesign atlas`.

### Task 15: Map page
**Files:** `app/(app)/map/**`
- [ ] Apply a dark map style (MapLibre dark basemap), accent-colored pins/resonance, dark timeline scrubber + filter bar + place-history drawer. Keep nearby feed, want-to-go, timeline, filters, lazy CSS load. Verify hidden-location posts (null coords) are excluded from pins.
- [ ] Verify + commit: `feat(cinema): redesign map`.

### Task 16: Saved + Activity
**Files:** `app/(app)/saved/page.tsx`, `app/(app)/activity/**`, `components/activity/**`
- [ ] Saved = dark `PostCard`/`PhotoTile` grid + dark `EmptyState`. Activity = day-grouped dark list, accent unread dot, avatars; keep follow-request accept/reject, SSE live updates, mark-read. Remove flight-path/stamp motif (use a simple hairline timeline).
- [ ] Verify + commit: `feat(cinema): redesign saved + activity`.

### Task 17: Settings (+ blocked/muted/sessions)
**Files:** `app/(app)/settings/**`, `components/settings/**`
- [ ] Dark `CinemaCard` panels, `SectionLabel` eyebrows, hairline dividers (no ticket/perforation). Fix any remaining `color:'white'` on accent buttons (use contrastText). Keep profile/appearance/security/data/danger, muted list, sessions list (current-device chip in accent), blocked list, export, delete.
- [ ] Verify + commit: `feat(cinema): redesign settings`.

### Task 18: Create flows
**Files:** `app/(app)/create/**`
- [ ] Dark forms: `PhotoTile` upload previews, dark inputs, `GlowButton` submit, location autocomplete styled dark, the per-post "hide exact location" toggle (already wired in API) surfaced as a switch. Keep multi-photo (cap 10), validation, location picker.
- [ ] Verify + commit: `feat(cinema): redesign create flows`.

### Task 19: Auth pages
**Files:** `app/(auth)/**`
- [ ] Cinematic split: left = full-bleed travel `PhotoTile` with vignette + brand wordmark (Posterama); right = dark form panel, `GlowButton` submit, accent focus rings. Keep validation, Google OAuth, CSRF, links, error display. This is the first impression — make it strong.
- [ ] Verify + commit: `feat(cinema): redesign auth pages`.

---

## Wave C — Visual verification gate (the step that was missing)

### Task 20: Screenshot harness + human review

**Files:**
- Create: `frontend/scripts/visual-check.cjs`

- [ ] **Step 1: Write the harness** (logs in as the seeded demo user, screenshots every page at desktop 1280 and mobile 390, logs console errors + 5xx per page)

```js
// frontend/scripts/visual-check.cjs
const { chromium } = require('@playwright/test');
const { mkdirSync } = require('fs');
const BASE = 'http://localhost:3002';
const OUT = '/tmp/viraha-cinema';
const EMAIL = process.env.SEED_EMAIL;       // from seed.ts (Pre-flight Step 3)
const PASSWORD = process.env.SEED_PASSWORD;
const PAGES = ['/home','/explore','/map','/albums','/journals','/atlas','/saved','/activity','/settings','/create/post'];

(async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  for (const vp of [{ w:1280,h:900,tag:'desktop' }, { w:390,h:844,tag:'mobile' }]) {
    const ctx = await browser.newContext({ viewport:{ width:vp.w, height:vp.h } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => m.type()==='error' && errs.push(m.text().slice(0,160)));
    page.on('response', r => r.status()>=500 && errs.push(`${r.status()} ${r.url().slice(0,70)}`));
    // login
    await page.goto(`${BASE}/sign-in`, { waitUntil:'networkidle' });
    await page.getByLabel('Email').fill(EMAIL).catch(()=>{});
    await page.getByLabel('Password', { exact:false }).first().fill(PASSWORD).catch(()=>{});
    await page.getByRole('button', { name:/sign in|log in/i }).first().click().catch(()=>{});
    await page.waitForTimeout(3500);
    for (const p of PAGES) {
      await page.goto(`${BASE}${p}`, { waitUntil:'networkidle' }).catch(()=>{});
      await page.waitForTimeout(1800);
      const name = `${vp.tag}${p.replace(/\//g,'_')||'_root'}`;
      await page.screenshot({ path:`${OUT}/${name}.png`, fullPage:false });
      const txt = (await page.locator('body').innerText().catch(()=>'')).replace(/\s+/g,' ').slice(0,120);
      console.log(`[${name}] ${page.url()} :: ${txt || 'EMPTY'}`);
    }
    console.log(`-- ${vp.tag} console/5xx errors (${errs.length}) --`);
    [...new Set(errs)].slice(0,20).forEach(e => console.log('  •', e));
    await ctx.close();
  }
  await browser.close();
})();
```

- [ ] **Step 2: Run it**

```bash
cd frontend && SEED_EMAIL='<demo email>' SEED_PASSWORD='<demo password>' node scripts/visual-check.cjs
```
Expected: one line per page (non-EMPTY text), error counts near zero. Screenshots in `/tmp/viraha-cinema/`.

- [ ] **Step 3: Human review (REQUIRED GATE)** — open every PNG. Reject and list any page that: is light/paper instead of dark; shows a broken/placeholder block where a photo should be; is empty/0-state despite seed data; has unreadable text (contrast); or shows a visually altered sidebar/mobile-nav. Record findings in `.swarm/cinema/VISUAL-REVIEW.md`.

- [ ] **Step 4: Adversarial code review** — dispatch reviewers (code-reviewer, frontend-reviewer) over the Wave-B diff for lost handlers, hydration hazards, menubar bleed, dark contrast. Append to `.swarm/cinema/VISUAL-REVIEW.md`.

- [ ] **Step 5: Commit the harness**

```bash
git add frontend/scripts/visual-check.cjs
git commit -m "test(visual): cinematic screenshot harness"
```

---

## Wave D — Fix findings + final verification

### Task 21: Close visual + review findings
- [ ] For each finding in `.swarm/cinema/VISUAL-REVIEW.md`, fix in the owning file (strict scope), re-run `node scripts/visual-check.cjs`, re-review the affected PNGs. Loop until clean.
- [ ] Commit per fix cluster: `fix(cinema): close visual review findings — <area>`.

### Task 22: Full green + done
- [ ] **Backend:** `cd backend && npx tsc --noEmit && npx vitest run` → tsc clean, suite passes.
- [ ] **Frontend:** `cd frontend && find .next -name "* 2.*" -delete; npx tsc --noEmit && npx vitest run && npx next build 2>&1 | tail -4` → clean/green/build ok.
- [ ] **Menubar proof:** `git diff main -- frontend/src/components/layout/sidebar.tsx frontend/src/components/layout/mobile-nav.tsx` → only intentional/zero changes.
- [ ] **Final screenshot pass** reviewed by eye = every page intentional dark cinematic + populated.
- [ ] Update memory (`project_prod_readiness.md`) with the redesign outcome. Final commit if needed.

---

## Self-review (spec coverage)

- **Dark cinematic system** → Tasks 1–6 (mode pin, tokens, theme, primitives, empty state). ✓
- **Aliveness** → Pre-flight (seed run), Task 7 (onboarding), Task 6 + per-page empty states, hero bug already fixed. ✓
- **Every surface except menubar** → Tasks 8–19 cover home, explore, post card/detail, profile, albums, journals, atlas, map, saved, activity, settings, create, auth; menubar excluded by the standing rule + Task 22 proof. ✓
- **Visual gate (the missing step)** → Tasks 20–21 (screenshot harness + human review + adversarial review). ✓
- **Definition of done (visual, not just green)** → Task 22. ✓
- **Risks** (taste miss, contrast, menubar bleed, photo rot) → mitigated by Wave-C gate, AA checks in Task 17/21, Task 22 menubar diff, PhotoTile fallback in Task 4. ✓
- No placeholders: foundation tasks (1–7) and the harness (20) contain complete code; page tasks (8–19) are precise specs against the named primitives with explicit files, behavior-preservation, and per-task verify+commit.
```
