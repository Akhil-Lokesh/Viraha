# UI Overhaul Discovery — Executive Summary

## Design System Verdict
**Coherent but generic.** Viraha has a sophisticated purple + gold palette, three custom fonts (TT Chocolates, Eastman, Posterama), full dark mode support, and excellent motion design via Framer Motion. However, the overall aesthetic leans heavily on Material-UI defaults—cards, grids, form layouts all feel standard. Strength is in the brand tokens and color infrastructure; weakness is in personality and visual differentiation.

## Menubar/Navigation (PRESERVED)
- **Desktop Sidebar:** `/src/components/layout/sidebar.tsx` — 72px fixed left sidebar with purple background, 10 nav items, animated active states (spring physics), travel mode toggle, profile avatar
- **Mobile Bottom Nav:** `/src/components/layout/mobile-nav.tsx` — 64px bottom bar with 4 primary tabs + white FAB for create, "More" sheet with 7 secondary destinations, responsive sheet interface
- **Quality:** ⭐⭐⭐⭐⭐ Excellent. Modern animations, accessible, responsive, clear information hierarchy. **Do not redesign.**

## Top 10 Components Needing Redesign (by impact)

1. **Dashboard Grid** (`dashboard/dashboard-grid.tsx`) — 20 resizable widgets, all generic rounded cards. Feels like a analytics dashboard, not a memory app.
2. **Explore/Feed** (`explore/page.tsx`) — Cramped 2-column layout (feed + sidebar map), trending section is an afterthought.
3. **Album Grid** (`albums/page.tsx`) — Standard 3-4 column grid, looks like Google Photos. No narrative flow.
4. **Journal Grid** (`journals/page.tsx`) — Similar to albums; custom colors underutilized.
5. **Post Card** (`post/post-card.tsx`) — Image + caption (truncated) + action row (cramped). Lacks personality.
6. **Profile Page** (`profile/[username]/page.tsx`) — Header + generic MUI tabs. No visual impact.
7. **Settings Page** (`settings/page.tsx`) — Boring tab-based forms. No visual hierarchy.
8. **Auth Pages** (`sign-in`, `sign-up`, etc.) — Minimal branding, no visual story.
9. **Activity Feed** (`activity/page.tsx`) — Chronological list, no grouping or visual distinction.
10. **Empty States** (`shared/empty-state.tsx`) — Too generic; lacks contextual guidance.

## Quick Stats
- **11 primary app routes** (home, explore, albums, journals, journeys, map, saved, atlas, activity, post detail, profile)
- **5 auth routes** (sign-in, sign-up, forgot-password, reset-password, verify-email)
- **60+ shared/layout components**
- **20 dashboard widgets** (4324 lines total)
- **3 custom fonts** (TT Chocolates, Eastman, Posterama)
- **Full dark mode support** (CSS variables + MUI dual color schemes)
- **Data layer:** TanStack Query v5.90.21, Zustand stores, Axios client with CSRF

## Redesign Opportunities
- **Dashboard:** Make it tell a story (travel timeline, memory highlights, seasonal insights) instead of a generic widget grid.
- **Feed/Explore:** Redesign for storytelling (group by journey, trending by community engagement, not just volume).
- **Cards:** Add visual richness (varied aspect ratios, masonry layouts, richer metadata, album/journey context).
- **Profile:** Design for impact (hero header, story-driven tab navigation, integrated stats).
- **Settings:** Mobile-first, rich previews (theme selector with visual examples), quick access patterns.
- **Empty States:** Context-specific copy + inline tutorials + clear CTAs.

## Architecture to Preserve
- **MUI v7.3.9** for component base (excellent M3 integration)
- **Framer Motion** for animation (spring physics pattern well-established)
- **Zustand** for client state (simple, effective)
- **TanStack Query** for data fetching (mature, battle-tested)
- **Next.js 16** with App Router (performance, i18n-ready)

## Design System Files
- `/src/lib/theme.ts` — MUI theme (color tokens, component overrides, typography)
- `/src/app/globals.css` — Custom fonts, gradients, utilities, MapLibre overrides
- `/src/components/ui/` — shadcn-style component library

---
**Full inventory:** `/Users/akhil/Desktop/Viraha/.swarm/overhaul/discovery/ui-inventory.md` (544 lines, complete routes, components, data layer, quality assessment, rationales)
