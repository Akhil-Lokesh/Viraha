# Viraha — Dark Cinematic Redesign + "Aliveness" (Design Spec)

**Date:** 2026-06-12
**Status:** Awaiting approval to execute
**Trigger:** Owner finds the current "Keepsake" (paper/editorial) redesign ugly and the app
"empty/dead." Wants a complete redesign of every surface **except the menubar** (sidebar +
mobile nav stay byte-for-byte), in a **dark cinematic** direction.

---

## 1. Problem statement (two distinct problems)

1. **Looks wrong** — the light paper/cream/serif "Keepsake" aesthetic is not what the owner wants.
   Photos sit on cream; the ornamental serif dominates; it reads "scrapbook," not "premium app."
2. **Feels dead** — verified in a live browser: a brand-new account sees 0/0/0 stats, empty feeds,
   and (now-fixed) a stranger's post as its hero. There is **no seed content**, so explore / map /
   trending / feed are barren. No CSS fixes "dead." Content does.

Both must be solved together or the result fails again.

## 2. Design language: "Dark Cinematic"

The app is "Letterboxd for travel." Letterboxd is dark and photo-forward; we lean into that.
**Photos are the light source; the UI is the dark room around them.**

### Tokens (replace the paper/ink/gold contract)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B0B0F` | app background (near-black, faint cool cast) |
| `--surface` | `#141419` | cards, panels |
| `--surface-2` | `#1C1C24` | raised/hover, inputs |
| `--hairline` | `rgba(255,255,255,0.08)` | borders (no heavy shadows) |
| `--text` | `#F4F4F6` | primary text |
| `--text-muted` | `#9A9AA6` | secondary text, labels |
| `--accent` | `#8B7CFF` | the ONE accent (harmonizes with kept `#7B68EE` sidebar) |
| `--accent-glow` | `rgba(139,124,255,0.35)` | hover glows, focus rings, active states |
| `--danger` | `#FF6B6B` | destructive |

Dark-only first (a light mode can follow later; not in scope). The kept sidebar's purple now
reads as the brand accent, deliberately.

### Form
- **Photos full-bleed, edge-to-edge**, gently vignetted; on hover a soft `--accent-glow` ring + 1.02 scale.
- **No soft drop shadows.** Depth = surface elevation + hairlines + the accent glow.
- **Type:** clean + confident. Headings in **Posterama** (geometric, already shipped) at large sizes /
  tight tracking; body in **TT Chocolates** (already shipped). Retire ResotYc ornamental serif and
  the passport-stamp/postcard motifs entirely. *(No new fonts — if owner wants a specific display
  font e.g. a grotesk, flag before adding.)*
- **Accent usage:** active nav-in-content, primary buttons, links, live dots, key numbers. Sparingly.
- **Motion:** cinematic = smooth and quiet. One orchestrated fade/ря-up on load (staggered),
  hero parallax on scroll, neon hover. Respect `prefers-reduced-motion`.
- **Empty states:** dark, illustrated (CSS/SVG), with a single bright accent CTA. Never blank.

### Reusable primitives (built once, used everywhere)
`<CinemaCard>` (surface + hairline + hover glow), `<PhotoTile>` (full-bleed image with vignette +
loading shimmer + broken-image fallback that is tasteful, not a salmon block), `<StatPill>`,
`<SectionLabel>` (muted uppercase), `<GlowButton>`, `<EmptyState>` (dark variant). One tokens
module, imported by all — no per-area copies (the last redesign forked 4 token files).

## 3. "Aliveness" (the other half — equal weight)

1. **Seed data (backend, idempotent `npm run seed:demo`)** — ~6 demo users with avatars, ~30–40
   posts using **real absolute https travel photo URLs** (so they always load), spread across real
   cities/coords worldwide, plus a few journals, albums, and a journey. Makes explore / map /
   trending / feed populated and the product legible on first open. Safe to re-run; never touches
   real users.
2. **First-run onboarding** — after signup, a short, skippable "add your first memory" path (or a
   warm welcome state) so a new user's own surfaces fill quickly.
3. **Rich empty states** — every empty surface (feed, saved, albums, journals, atlas, activity,
   map) gets a dark illustrated state + clear CTA. No 0/0/0 dead air.
4. **Kill "dead" data bugs** — audit dashboard widgets / atlas / feed for places that render zeros or
   nothing due to wiring, not absence of data. (Home hero already fixed: shows YOUR latest, not a
   stranger's.)

## 4. Scope (every surface except the menubar)

Home, Explore + PostCard (flagship), Post detail, Profile, Albums (+detail/edit), Journals
(+detail/entry editor chrome), Atlas, Map, Saved, Activity, Settings (+blocked/muted/sessions),
Create flows (post/album/journal), Auth pages, shared loading/empty/error, global theme + globals.css.
**Untouched:** `components/layout/sidebar.tsx`, `components/layout/mobile-nav.tsx`.

## 5. Execution (waves) — with the step that was missing last time

- **Wave A — Foundation (serial, lands first):** dark token contract in `theme.ts` + `globals.css`;
  the reusable primitives (§2); the backend seed script + run it; onboarding scaffold. Everything
  downstream codes against these tokens/primitives.
- **Wave B — Page redesigns (parallel, disjoint file ownership):** one agent per area applies Dark
  Cinematic using the primitives. Strict no-touch on the menubar. Backward-compatible component
  props. Keep all data wiring, a11y, loading/empty/error.
- **Wave C — Review + LIVE VISUAL VERIFICATION (the fix for last time):** adversarial code review
  **plus** a Playwright pass that logs in as a *seeded* user and screenshots **every** page (desktop
  + mobile widths); I review the screenshots and reject anything that looks broken/empty before
  declaring done. This is the gate that "all tests green" skipped.
- **Wave D — Fix findings + final verify:** close review + visual findings; backend + frontend tsc,
  test suites, `next build`; re-screenshot. Commit per wave.

## 6. Definition of done (visual, not just green tests)

- Logged in as a seeded demo user, **every** page screenshots as intentional, populated, on-brand
  dark cinematic — reviewed by eye, not inferred from 200s.
- A brand-new account sees inviting onboarding + populated explore/map (via seed), never 0/0/0 dead air.
- Menubar visually identical. tsc clean both sides, suites pass, `next build` green.

## 7. Explicitly out of scope (YAGNI)

Light mode, new fonts (unless owner asks), PostGIS migration, new social features, native apps,
real CDN photo hosting (seed uses public URLs).

## 8. Risks

- **Taste miss again** → mitigated by the chosen concrete direction + the Wave-C visual gate (owner
  sees screenshots before "done").
- **Dark contrast/a11y** → enforce AA on text/accent; reduced-motion honored.
- **Seed photo URLs rotting** → use stable providers; fallback tile is tasteful.
- **Menubar bleed from global theme** → verify sidebar/mobile-nav pixels unchanged in Wave C.
