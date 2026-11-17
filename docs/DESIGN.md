# Viraha — Design: Dark Cinematic

**Photos are the light source; the UI is the dark room around them.**

Viraha is dark-only. Surfaces recede so travel photography carries the color, and a single
violet accent marks what's interactive or alive.

## Tokens

One palette, defined twice so both MUI `sx` and plain CSS can use it — keep them in sync:
`frontend/src/lib/design/cinema-tokens.ts` (`CIN`) and the `--cin-*` variables in
`frontend/src/app/globals.css`. The MUI theme (`frontend/src/lib/theme.ts`) is built from `CIN`.

| Token | Value | Use |
|-------|-------|-----|
| `bg` | `#0B0B0F` | page background |
| `surface` | `#141419` | cards, panels, dialogs |
| `surface2` | `#1C1C24` | inputs, raised/hover states |
| `hairline` | `rgba(255,255,255,0.08)` | every border |
| `text` | `#F4F4F6` | primary text |
| `textMuted` | `#9A9AA6` | secondary text, labels |
| `accent` | `#8B7CFF` | the one accent: primary buttons, links, active states, key numbers |
| `accentGlow` | `rgba(139,124,255,0.35)` | hover glows and focus rings |
| `danger` | `#FF6B6B` | destructive actions |

Shared style helpers in the same module: `eyebrowSx` (muted uppercase label), `displaySx`
(large display heading), `photoVignette` (caption legibility over photos), `glowRing()`
(hover/focus ring).

## Type

- **Posterama** — display headings (uppercase, tight leading) and eyebrow labels.
- **TT Chocolates** — everything else (`--font-body`).

Both ship in `frontend/public/fonts`. Don't add new families without a design decision.

## Form

- **No soft drop shadows.** Depth comes from surface steps, hairlines and the accent glow
  (`theme.shadows` is all hairline rings).
- **Photos go full-bleed** with a bottom vignette when text sits on them, and never show a
  raw broken image — `PhotoTile` renders a striped or gradient fallback.
- **Accent sparingly**: one primary action per view.
- **Every empty surface gets an `EmptyState`** with one clear next action — never 0/0/0
  dead air.
- **Motion is quiet**: a staggered fade-up on load (`fadeInUp`, `staggerContainer` in
  `lib/animations.ts`), springy presses on actions. Everything honors
  `prefers-reduced-motion`.
- **The sidebar and mobile nav** (`components/layout/sidebar.tsx`, `mobile-nav.tsx`) are the
  fixed frame of the product; restyle pages, not the menubar.

## Primitives

Build screens from these before reaching for raw MUI:

| Component | Where | For |
|-----------|-------|-----|
| `CinemaCard` | `components/cinema` | dark surface + hairline; `hover` adds glow and lift |
| `PhotoTile` | `components/cinema` | full-bleed photo with vignette, loading base and fallback |
| `GlowButton` | `components/cinema` | `solid` (accent) or `ghost` buttons |
| `StatPill` | `components/cinema` | a number with a label |
| `SectionLabel` | `components/cinema` | muted uppercase section heading |
| `EmptyState` | `components/shared` | illustrated empty surface with one CTA |
| `ConfirmDialog` | `components/shared` | confirmation for destructive actions |
| `UserAvatar` | `components/shared` | avatar with initials fallback; links to the profile unless `link={false}` |

Media paths from the API may be relative (`/uploads/...`); always pass them through
`resolveMediaUrl` (`lib/media-url.ts`) or a primitive that does.

## Maps

Every map uses the OpenFreeMap dark basemap (`lib/design/map-style.ts`). Pins and popups are
DOM elements styled with the tokens above, so they match the rest of the UI.
