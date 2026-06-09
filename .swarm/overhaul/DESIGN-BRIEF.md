# Viraha UI Overhaul — Design Brief (binding for all UI agents)

## Concept: "The Keepsake" — editorial travel journal

Viraha is Letterboxd for travel. The current UI is a competent but generic MUI app:
purple chrome, soft shadows, rounded cards, dashboard-grid energy. The redesign keeps the
**navigation chrome exactly as-is** and transforms every content surface into something that
feels like a *beautifully kept travel journal* — warm, tactile, editorial — not an analytics tool.

One thing a visitor must remember: **your memories look like artifacts** (postcards, passport
stamps, ticket stubs, flight paths), not database rows.

## Hard constraints

- **DO NOT TOUCH**: `src/components/layout/sidebar.tsx`, `src/components/layout/mobile-nav.tsx`.
  Their purple `#7B68EE` chrome stays the only big block of purple in the app.
- Keep MUI v7 + Framer Motion + Tailwind tokens. Restyle via `sx`, theme, and component CSS —
  do not introduce new UI libraries or fonts (use the four already shipped).
- All existing functionality, hooks, data wiring, a11y attributes, and test ids must keep working.
  This is a re-skin + layout rework, NOT a logic rewrite. Never remove loading/empty/error states —
  restyle them.
- Dark mode must remain fully supported (use the existing CSS variable system).
- `npx tsc --noEmit` and `npx vitest run` must stay green; do not break `next build`.

## Visual language

**Typography** (fonts already in repo — use them properly):
- `ResotYc` (ornamental serif) — display moments: page titles, big numbers (atlas stats,
  country counts), pull-quotes. Currently almost unused; it becomes the signature.
- `Posterama` — eyebrows/labels: uppercase, letter-spaced (0.12em+), small (11–12px).
  e.g. "FIELD NOTES", "47.6062° N, 122.3321° W".
- `TT Chocolates` — body, unchanged.

**Color** (extend tokens, don't replace):
- Surfaces go **warm paper**: cream `#FAF6EE`-family backgrounds in light mode; deep
  ink-plum (near-black with purple undertone, e.g. `#16121F`) in dark mode. Kill pure white/grey page backgrounds.
- **Gold `#D4A843`** is the accent of record: stamps, active states inside content, highlights, dividers.
- Purple appears in content only as small interactive accents (links, FAB) — the sidebar owns purple.
- Ink text: warm near-black `#221C18` (light) / warm cream (dark), not grey-700.

**Motifs** (use 2–3 per page, consistently):
- *Passport stamp*: country/city chips as slightly-rotated bordered stamps (1.5px solid gold/ink,
  subtle rotation -2°..2°, Posterama caps).
- *Postcard/polaroid*: photo cards with thick bottom padding, slight rotation on hover,
  paper-grain texture (CSS `repeating-linear-gradient` or tiny SVG noise via data-URI — no new asset files).
- *Flight path*: dashed connector lines (SVG/CSS dashed borders, 1px, gold) between sequential items
  (journeys, timelines, activity groups).
- *Coordinates eyebrow*: lat/lng or date rendered as letter-spaced Posterama microtext above titles.
- *Ticket-stub divider*: section breaks with perforation dots / notched edges.

**Depth & texture**: replace soft ambient `box-shadow` blur with either (a) flat paper +
1px ink/gold hairline borders, or (b) small hard offset shadows (2–3px, low blur). No glassmorphism on content.

**Motion**: one orchestrated page-load stagger per page (Framer Motion, 40–60ms stagger,
y: 12 → 0, opacity). Hover: postcard tilt (rotate 0.5–1.5°, scale 1.01, spring). Keep it restrained;
no scroll-jacking.

**Spatial composition**: break the uniform-grid habit. Asymmetric editorial layouts: a hero
memory + supporting smaller items; overlapping photo stacks; generous whitespace around display serifs.
Mobile stays single-column and calm.

## Per-page notes

- **/home**: from "20-widget dashboard" to a *journal opening spread*: greeting in ResotYc, a hero
  "latest memory" postcard, a slim stats strip (stamps, not stat-cards), recent activity as a margin column.
  Keep widget data hooks; you may regroup/restyle/cut chrome, not data plumbing or the edit-layout feature
  (it may be visually de-emphasized behind its existing toggle).
- **/explore**: editorial feed — full-bleed postcard posts, trending locations as a stamp rail, search styled as a field-notes input.
- **Post card**: the flagship component. Postcard treatment, location stamp, coordinates eyebrow, actions as quiet icon row with gold active states.
- **/profile**: cover area = passport spread (display-serif name, home-base stamp, stat stamps), tabs restyled as journal tabs.
- **/albums, /journals**: shelf metaphors — albums as photo stacks (overlap), journals keep per-journal custom color as the *spine/cover* color.
- **/atlas**: ResotYc big numbers, continent progress as stamped passport pages.
- **/activity**: grouped by day with flight-path connector, unread = gold dot.
- **/settings**: calm paper forms, Posterama section eyebrows; function unchanged.
- **Auth pages**: the first impression — split layout, oversized ResotYc brand moment, paper texture, stamp detail.
- **Empty states**: each gets a motif illustration built from the motifs above + a clear CTA ("No stamps yet — post your first memory").
