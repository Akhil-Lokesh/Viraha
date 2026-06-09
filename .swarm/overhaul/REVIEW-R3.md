# REVIEW-R3 — Keepsake Redesign Regression Review
Commit: 180b8f4  
Reviewed: 2026-06-09  
Reviewer lens: what did the redesign break or lose, and where is it incoherent?

---

## 1. PRESERVATION CHECK — sidebar.tsx / mobile-nav.tsx

Neither file appears in `git show 180b8f4 --stat`. Byte-identical confirmed.

Theme palette impact on sidebar: `surfaceContainerHighest` is pinned in both color
schemes (`#E6E0EA` light / `#36343B` dark) with an explicit comment in theme.ts line 315
and 344. The sidebar uses `bgcolor: 'primary.main'` (purple pill) — unaffected by the
cream/ink palette shift. The toggle thumb that previously depended on
`surfaceContainerHighest` remains at the pinned value. No visual regression on nav.

---

## 2. FINDINGS

---

### [HIGH] frontend/src/app/(app)/activity/page.tsx:253 — useActivityStream mounted only on the activity page; SSE stream stops on navigation

```
Current:  useActivityStream(); // in ActivityPage component body
Fix:      Move call to frontend/src/app/(app)/layout.tsx (add 'use client' wrapper or a
          thin ActivityStreamProvider component), mirroring the comment at line 251 which
          already acknowledges this.
```

The hook is a refcounted singleton — mounting it in the (app) layout costs exactly one
extra EventSource (already open), and `mountCount` prevents double-connecting. Without
this, the Bell icon in the sidebar has no live unread count update. The sidebar does not
call `useUnreadCount` at all, so the Bell renders with no badge today regardless;
however once that badge is wired in (the obvious next step), the stream must already be
app-wide or the badge will only update while the user sits on /activity. This is the
blocker for golden-path step "view in feed" receiving real-time like/follow signals.

Exact wiring needed: create
`frontend/src/components/layout/activity-stream-mount.tsx` as a `'use client'`
component that calls `useActivityStream()` and renders nothing, then render it inside
`AppLayout` in `frontend/src/app/(app)/layout.tsx`.

---

### [HIGH] frontend/src/app/(app)/settings/page.tsx:402,988 — `color: 'white'` hardcoded on `bgcolor: 'secondary.main'` buttons; fails WCAG AA in both light and dark mode

```
Current (line 402):  bgcolor: 'secondary.main', color: 'white',
Current (line 988):  bgcolor: 'secondary.main', color: 'white',
Fix:     Remove the `color: 'white'` override; let MUI use palette.secondary.contrastText.
         Light contrastText = '#221C18' (dark ink on gold — passes AA).
         Dark contrastText  = '#16121F' (deep ink on brightened gold — passes AA).
Why:     Gold (#D4A843 light / #E2BC5C dark) against white text produces ~1.95:1 contrast
         ratio — well below WCAG AA 4.5:1. The "Save Changes" (ProfileTab) and
         "Change Password" (AccountTab) buttons are unreadable in dark mode.
```

Affected buttons: ProfileTab "Save Changes" (line 401–405), AccountTab "Change Password"
(line 987–991). The privacy-confirm dialog CTA at line 793 does NOT set `color: 'white'`
explicitly and is therefore fine.

---

### [HIGH] frontend/src/components/post/post-card.tsx:82 and frontend/src/components/dashboard/hero-memory.tsx:68 — `formatDistanceToNow` / `toLocaleDateString` called at render time in SSR-capable components produces hydration mismatch

```
Current (post-card.tsx:82):
  const timeAgo = postedDate ? formatDistanceToNow(postedDate, { addSuffix: false }) : null;

Current (hero-memory.tsx:68):
  const postedDate = new Date(latest.postedAt).toLocaleDateString('en-US', { ... });

Fix (both):  Wrap the computed value in a useState initialised to a static fallback
             (the ISO date string or null) and update it in a useEffect, or add
             suppressHydrationWarning on the wrapping Typography.
             The suppressHydrationWarning approach is the smallest change:
               <Typography suppressHydrationWarning ...>{timeAgo}</Typography>
Why:         Server renders at request time; client re-renders ~milliseconds later.
             formatDistanceToNow produces "3 minutes ago" on server and "3 minutes ago"
             on client only if they run at the exact same millisecond. In practice this
             always mismatches ("2 minutes" vs "3 minutes"), React logs a hydration
             error, and the full subtree re-renders on mount causing a flash.
```

Both components are `'use client'` but Next.js App Router still SSR-renders client
components on the server for the initial HTML. The mismatch fires on every page load
where a post card is above the fold.

---

### [HIGH] frontend/src/components/post/post-detail.tsx:931 — `format(new Date(post.postedAt), 'MMM d, yyyy')` rendered directly in JSX without suppression

```
Current (line 931):
  {format(new Date(post.postedAt), 'MMM d, yyyy')}
Fix:     Add suppressHydrationWarning to the wrapping Typography at line 928, or move
         the date format call into a useEffect.
Why:     Same SSR/client mismatch as above; the post detail page is a high-traffic route
         (golden-path view step).
```

---

### [MEDIUM] frontend/src/app/(app)/explore/page.tsx:8 — `maplibre-gl/dist/maplibre-gl.css` statically imported at module level; loaded for every visitor regardless of xl breakpoint

```
Current:  import 'maplibre-gl/dist/maplibre-gl.css';  // line 8 — top of explore/page.tsx
Fix:      Move SidebarMap into a separate file (e.g. components/explore/sidebar-map.tsx)
          and dynamic-import it: const SidebarMap = dynamic(() => import('./sidebar-map'),
          { ssr: false }). Import the CSS inside that file.
Why:      The map is hidden below xl breakpoint (display: { xs: 'none', xl: 'flex' }).
          ~95% of mobile users download the full MapLibre CSS (~20 KB) for a map they
          will never see. This was flagged in observation 1648 (Jun 2) as a known issue
          but was not fixed in this commit.
```

---

### [MEDIUM] frontend/src/components/user/user-profile-header.tsx:149 — `window.confirm()` for block action; non-functional in mobile WebViews and inconsistent with design system

```
Current:  window.confirm(`Block @${user.username}? ...`)
Fix:      Replace with a MuiDialog confirmation matching the pattern used in settings
          (the private-account confirm dialog at settings/page.tsx:754 is an exact
          template — copy that pattern).
Why:      window.confirm is blocked in many mobile browsers/WebViews. The block action
          silently fails (confirm returns true on headless/JSDOM, so tests pass, but
          users on iOS PWA or certain Android WebViews see no dialog and the block fires
          immediately without confirmation).
```

---

### [MEDIUM] frontend/src/app/(app)/settings/page.tsx:397–410 — ProfileTab Save Changes button is `type="submit"` inside a `<form>` but Change Password form is also `component="form"` in AccountTab; wrong `type` attributes risk cross-form submission

Both ProfileTab and AccountTab render `component="form"` wrapping Box elements. They are
conditionally rendered under the same SettingsContent tab switcher, so only one is in
the DOM at a time. No actual cross-submission risk exists. However:

```
Current (line 396):  <Button type="submit" ... > inside ProfileTab form
Fix:     No change needed — this is correct. Note for reviewers: the AccountTab Change
         Password button (line 979) also correctly uses type="submit".
```

Marking this MEDIUM only because the `component="form"` pattern on `<Box>` does not
register a native `<form>` element's accessible role; screen readers may not announce
the form landmark. Fix: use `<Box component="form" role="form" aria-label="Update profile">`.

---

### [MEDIUM] Token divergence across four local keepsake files — consolidation needed

Four independent token files define overlapping constants:

| File | What it defines |
|------|----------------|
| `frontend/src/components/post/keepsake.ts` | `GOLD`, `paper()`, `ink()`, `inkMuted()`, `hairline()`, `hardShadow()`, `grain()`, `EYEBROW_SX` |
| `frontend/src/components/activity/keepsake.ts` | `KEEPSAKE.{paper,ink,gold,goldSoft,hairline}`, `eyebrowSx`, animation variants |
| `frontend/src/components/dashboard/journal-tokens.ts` | `getJournalTokens()` (mode-aware), `eyebrowSx`, `displaySerifSx`, animation variants |
| `frontend/src/components/settings/paper-panel.ts` | `paperPanelSx`, `VIRAHA_GOLD` |

Divergences found:
- `GOLD` is a CSS-var string in post/keepsake.ts and activity/keepsake.ts, but
  `VIRAHA_GOLD` in paper-panel.ts is identical (`'var(--viraha-gold, #D4A843)'`).
- `eyebrowSx` in activity/keepsake.ts has `fontSize: '11px'` and no `fontWeight`;
  the same in journal-tokens.ts has `fontWeight: 600` and `letterSpacing: '0.16em'`;
  EYEBROW_SX in post/keepsake.ts has `fontSize: '0.6875rem'` (~11px) with `fontWeight: 600`.
  The px vs rem inconsistency means the eyebrow text scales differently under browser
  font-size user preferences.
- `hardShadow()` in post/keepsake.ts returns `'4px 4px 0 ...'`; the theme's
  `hardShadow()` function in theme.ts uses `1px..4px` based on elevation level.
  Atlas page hardcodes `'3px 3px 0 ...'` inline (profile/page.tsx:458).

Fix (LOW priority): create `frontend/src/lib/design-tokens.ts` as the single source
exporting all shared tokens; have the four files re-export from it.

---

### [MEDIUM] frontend/src/app/(app)/atlas/page.tsx:31 — `grain` constant defined inline with light-only values; renders incorrectly in dark mode

```
Current (line 31):
  const grain = 'repeating-linear-gradient(0deg, rgba(34,28,24,0.02) ...' // ink-on-paper only

Fix:     Import `grain(isDark)` from post/keepsake.ts (already exists as a function),
         or use the mode-aware version from journal-tokens.ts getJournalTokens().
Why:     In dark mode the grain uses near-black ink color (rgba(34,28,24,...)) on a
         dark background — the grain becomes invisible rather than the warm cream grain
         intended. The travel-style stamp and country badges lose their paper texture.
```

---

### [MEDIUM] frontend/src/components/activity/activity-day-group.tsx:22 — `toLocaleDateString('en-US', ...)` called server-side for day labels; SSR locale mismatch

```
Current (line 22):
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', ... });
Fix:     Add suppressHydrationWarning on the Typography rendering the day label in
         ActivityDayGroup, or use date-fns `format()` which produces identical output
         regardless of runtime locale.
Why:     Node.js ICU data and browser locale can diverge (especially on minimal Docker
         images with partial ICU). The day label "June 3" vs "June 03" mismatch triggers
         a React hydration error on the activity page.
```

---

### [MEDIUM] frontend/src/components/settings/paper-panel.ts:17 — `boxShadow: '2px 2px 0 rgba(34, 28, 24, 0.06)'` is a hardcoded light-mode ink shadow; invisible in dark mode

```
Current:  boxShadow: '2px 2px 0 rgba(34, 28, 24, 0.06)',
Fix:      Replace with the theme shadow system or use a CSS var:
          boxShadow: 'var(--viraha-paper-shadow, 2px 2px 0 rgba(34,28,24,0.06))'
          and define --viraha-paper-shadow in globals.css per color scheme.
          Alternatively use the keepsakeShadows[1] from the theme (already a hard offset shadow).
Why:      In dark mode rgba(34,28,24,0.06) is near-transparent on a dark surface —
          the paper panel depth effect vanishes. The Keepsake brief requires hard offset
          shadows in both modes.
```

---

### [LOW] frontend/src/app/(app)/explore/page.tsx:412 — stamp rotation uses `i % 2` inside a horizontal scroll rail; deterministic but rotation is applied as a CSS `transform` inside `sx`, which combines with Framer Motion's `whileHover: { rotate: 0 }` causing a double-transform conflict

```
Current (line 412):
  transform: `rotate(${i % 2 === 0 ? -1.5 : 1.2}deg)`,
  // + motion.div whileHover={{ rotate: 0, scale: 1.04 }}  (line 399)
Fix:     Set the initial rotation via Framer Motion's `initial={{ rotate: i % 2 === 0 ? -1.5 : 1.2 }}`
         and `animate={{ rotate: i % 2 === 0 ? -1.5 : 1.2 }}` so the hover reset has a
         clear reference frame. Using both MUI sx transform and framer-motion rotate on
         the same element creates competing transform matrices.
Why:     On hover, the card snaps from the CSS-set rotation to Framer's 0deg rather than
         smoothly transitioning, because CSS transform and FM transform fight for the
         same property.
```

---

### [LOW] frontend/src/app/(app)/settings/page.tsx:453 — Appearance tab theme picker grid is `gridTemplateColumns: '1fr 1fr 1fr'` — fixed 3-column at all breakpoints including xs

```
Current (line 453):  gridTemplateColumns: '1fr 1fr 1fr'
Fix:     gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }
         (or keep 3-col but ensure minimum card width doesn't truncate "System / Match your device")
Why:     On narrow screens (320–375px) the three theme cards are ~93px wide each.
         "Match your device" caption truncates. Minor, but the settings page is
         sticky-top-tabbed so it's above the fold on every settings visit.
```

---

### [LOW] frontend/src/app/(auth)/layout.tsx — animated SVG flight path uses CSS animation `flight-drift` defined via `style={{ animation: '...' }}` on the `<path>` element; the animation moves `stroke-dashoffset` but the keyframe in globals.css only defines `stroke-dashoffset: -240` without the element having a `stroke-dashoffset` starting value set

```
Current (globals.css:201-205):
  @keyframes flight-drift { to { stroke-dashoffset: -240; } }
Current (auth/layout.tsx:84):
  style={{ animation: 'flight-drift 14s linear infinite' }}
Fix:     Add strokeDashoffset={0} to the <path> element so the from-value is explicit.
Why:     Without an explicit initial value, the animation start point is undefined in
         SVG. Some browsers animate from 0, others from the computed value. The path
         may not animate at all in Firefox.
```

---

### [LOW] globals.css:254–256 — `font-size: 16px !important` on all `input, select, textarea` overrides the Posterama eyebrow placeholder font size in the explore search bar

```
Current (globals.css:255):  font-size: 16px !important;
Current (explore/page.tsx:733):
  '&::placeholder': { fontFamily: 'var(--font-brand)', fontSize: '0.75rem', ... }
Fix:     The 16px override correctly prevents iOS zoom but obliterates the `0.75rem`
         placeholder font-size via specificity. Scope the override:
           input:not([data-brand-input]), select, textarea { font-size: 16px !important; }
         and add data-brand-input to the explore search Box/input.
         Or accept the 16px placeholder (minor visual degradation, no functional loss).
Why:     The Posterama eyebrow placeholder at 0.75rem is part of the design brief;
         the !important override silently wins and the placeholder renders at 16px.
```

---

### [LOW] frontend/src/app/(app)/home/page.tsx:164 — desktop FAB lacks `aria-label` on the icon-only Box button

```
Current (line 164):
  <Pencil style={{ width: 20, height: 20 }} />
  // The wrapping <Link> has aria-label="Create new post" — correct
Fix:     The Link already carries the aria-label at line 142; the inner Box does not need
         one. This is fine as-is. Removing from findings.
```

(Self-correction: Link with aria-label wraps the FAB; screen readers read the link label. No issue.)

---

### [LOW] Rotation convention divergence across redesigned components

| Component | Rotation pattern |
|-----------|----------------|
| atlas/page.tsx countries | `i % 2 === 0 ? -1.5 : 1.5` deg |
| explore/page.tsx stamp rail | `i % 2 === 0 ? -1.5 : 1.2` deg |
| activity/page.tsx empty stamp | `rotate(-2deg)` hardcoded |
| user-profile-header StatStamp | per-item rotation prop, values -1.5/0.5/1 |
| auth/layout.tsx stamps | per-item `--stamp-rotate` CSS var, values -3/2/-1.5 |
| post/page.tsx not-found stamp | `rotate(-2deg)` |

The design brief implies a consistent ±1.5 deg convention for stamp chips. The `-2deg`,
`1.2deg` outliers produce a slightly heavier tilt than the rest of the system.

Fix (LOW): standardize on `rotate: i % 2 === 0 ? -1.5 : 1.5` for list-generated stamps;
reserve `-2deg` / `-3deg` for hero/feature stamps.

---

## 3. CHECKLIST AGAINST BRIEF REQUIREMENTS

### 2. Lost Functionality — diff summary

All of the following were verified present in post-detail.tsx or post-card.tsx:

| Feature | Status |
|---------|--------|
| Comment create/edit/delete | PRESENT — post-detail.tsx CommentItem, CommentBody |
| Comment replies | PRESENT — ReplyRow, useReplies |
| Infinite scroll (comments) | PRESENT — fetchNextPage button |
| Lightbox | PRESENT — ImageLightbox component, line 1237 |
| Save / unsave | PRESENT — handleSave, toggleSave |
| Follow / unfollow from post | PRESENT — handleFollow, lines 495–501 |
| Add to album | PRESENT — AddToAlbumDialog, line 1230 |
| Report post | PRESENT — ReportDialog with hidden trigger, line 1246 |
| Report user | PRESENT — on profile page, line 349 |
| Block user | PRESENT — user-profile-header.tsx line 146 |
| Mute / unmute | PRESENT — profile/page.tsx handleMuteToggle |
| Toggle post comments | PRESENT — handleToggleComments, post-detail.tsx line 442 |
| Dashboard edit mode toggle | PRESENT — home/page.tsx isEditMode toggle, DashboardGrid |
| Dashboard DnD (edit mode) | PRESENT — DashboardGrid with onMove/onResize/onRemove props |
| Widget catalog | PRESENT — WidgetCatalogDrawer |
| Theme picker | PRESENT — settings/page.tsx AppearanceTab |
| Data export | PRESENT — settings/page.tsx handleExport |
| Account delete | PRESENT — settings/page.tsx handleDeleteAccount with username confirm |
| TipTap rich text editor | PRESENT — rich-text-editor.tsx imported in journal-entry-card |
| Infinite scroll (feed) | PRESENT — explore/page.tsx fetchNextPage button |
| Follow requests section | PRESENT — activity/page.tsx FollowRequestsSection |

No functionality was removed by the redesign.

### 3. Hydration/SSR hazards — summary

| Risk | Location | Severity |
|------|----------|----------|
| `formatDistanceToNow` at render time | post-card.tsx:82 | HIGH |
| `toLocaleDateString` at render time | hero-memory.tsx:68 | HIGH |
| `format(new Date(...))` at render time | post-detail.tsx:931 | HIGH |
| `toLocaleDateString('en-US', ...)` in dayLabel | activity-day-group.tsx:22 | MEDIUM |
| `window.location.origin` in handleShare | post-card.tsx:124 | LOW (inside click handler — safe) |
| `window.confirm` in handleBlock | user-profile-header.tsx:149 | MEDIUM (inside click handler, but fails silently in WebViews) |
| SVG flight path drift animation | auth/layout.tsx:84 | LOW |

CSS variables (`var(--viraha-*)`) used in MUI sx are resolved at paint time by the
browser — not SSR-sensitive. No JS-computed colors were found in theme.ts (all
`alpha()` calls are at module load, not render). No rotation values use `Math.random()`.
Stamp rotations are deterministic (`i % 2`, hardcoded degrees). No SSR hazard from
visual randomness.

`window` and `EventSource` in `use-activity-stream.ts` are gated at line 207:
`typeof window === 'undefined' || typeof window.EventSource === 'undefined'`. Safe.

### 4. Realtime mount — confirmed finding

`useActivityStream()` is called only in `frontend/src/app/(app)/activity/page.tsx:253`.
The hook comment (line 251) acknowledges the layout adoption as future work. The
singleton design handles multiple mounts correctly (mountCount). Moving to layout is the
right call and is explicitly signposted by the original author.

### 5. Dark mode — spot-check results

| Location | Issue |
|----------|-------|
| settings/page.tsx:402,988 | `color:'white'` on gold secondary.main — FAILS (reported HIGH above) |
| settings/paper-panel.ts:17 | Ink shadow invisible in dark — REPORTED MEDIUM |
| atlas/page.tsx:31 | Light-only grain on dark bg — REPORTED MEDIUM |
| post-card.tsx | All colors via `isDark` boolean function calls — OK |
| explore/page.tsx map overlay | `rgba(22,18,31,0.35)` gradient overlay hardcoded — acceptable (map is always dark) |
| auth/layout.tsx | Brand panel hardcoded `PANEL_INK = '#16121F'` with cream text — intentional, no mode switch |

No ink-on-ink or gold-on-gold combinations found in dark mode. The activity/keepsake.ts
`KEEPSAKE.paper = 'var(--viraha-paper, #FAF6EE)'` will resolve to the correct dark value
via CSS var at runtime. The fallback `#FAF6EE` (cream) would only apply if the CSS var
is missing — which cannot happen while globals.css is loaded.

### 6. Consistency — keepsake token files

Reported MEDIUM above. Four local token files, identified divergences in `eyebrowSx`
(px vs rem, missing fontWeight), `hardShadow` (3px vs 4px offsets), grain (mode-aware
vs light-only), and `GOLD`/`VIRAHA_GOLD` duplication.

### 7. A11y

- `aria-label` on all icon-only buttons: verified present on post-card Save, Share,
  More-options; post-detail Back, Save, Add to Album, Share, More options, Photo nav
  arrows, dot indicators; profile-page More-options; settings camera button implicitly
  labelled by Change Photo sibling Button.
- StatStamp in user-profile-header has `role="button"` and `tabIndex` when interactive,
  plus `aria-label` prop and `onKeyDown` Enter/Space handler. Correct.
- Focus states: MUI `focusVisible` outline is present on the new gold-styled components
  via `'&:focus-visible': { outline: '2px solid ${GOLD}' }` in user-profile-header.tsx:85.
- Reduced-motion: NO `@media (prefers-reduced-motion)` in globals.css. Framer Motion
  has a `useReducedMotion` hook but none of the redesigned components call it. The
  post-card `whileHover={{ rotate: -0.7, scale: 1.01 }}` and the stagger animations
  will still run for users who have requested reduced motion.

```
[MEDIUM] globals.css — no @media (prefers-reduced-motion) rule
  Current: (absent)
  Fix:     Add to globals.css:
             @media (prefers-reduced-motion: reduce) {
               *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
             }
           Framer Motion will still animate unless components call useReducedMotion();
           adding the CSS rule covers non-FM transitions and satisfies WCAG 2.1 SC 2.3.3.
  Why:     Users with vestibular disorders who set "reduce motion" in OS settings will
           see the full stamp tilt, stagger, and postcard hover animations.
```

### 8. Mobile

- Trending stamp rail in explore/page.tsx has `overflowX: 'auto'`, `scrollbarWidth: 'none'`. Scrollable. OK.
- User search rail in explore/page.tsx has `overflowX: 'auto'`, `'&::-webkit-scrollbar': { display: 'none' }`. OK.
- Asymmetric profile header grid collapses: cover/avatar/stats are single-column by design. OK.
- Journals page search box: `flex: { xs: 1, md: 'unset' }` — expands to fill on mobile. OK.
- Atlas stats strip: `gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }`. Collapses correctly.
- FAB positioning: home/page.tsx `display: { xs: 'none', md: 'flex' }` — desktop only. Journals/Explore FABs use `bottom: { xs: 80, md: 32 }` to clear BottomNav. OK.
- AppLayout `pb: { xs: 'calc(88px + env(safe-area-inset-bottom, 0px))', md: 3 }` — safe-area aware. OK.
- Settings tab bar: `position: { xs: 'sticky', md: 'relative' }, top: { xs: 52, md: 'auto' }` — sticky above content on mobile. OK.
- No fixed widths found that break below 768px. The stamp rails and country badge wraps handle overflow correctly.

---

## 4. COUNTS

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 4 |
| MEDIUM   | 7 |
| LOW      | 5 |
| **Total**| **16** |

---

## 5. TOP 3 FIXES THAT UNBLOCK THE GOLDEN PATH

### Golden path: sign-up → first post → view in feed

**Fix 1 — HIGH: Hydration mismatch on `formatDistanceToNow` / date rendering**

Every feed card (`PostCard`) and the post detail page render `formatDistanceToNow` and
`format(new Date(...))` at render time without `suppressHydrationWarning`. This produces
a React hydration error on every page load where a post is visible — which is every step
of the golden path after "first post". The error degrades to a full client-side re-render
on mount, causing a visible content flash.

Smallest fix — three files, add `suppressHydrationWarning` to the wrapping Typography:
- `frontend/src/components/post/post-card.tsx` line 211 Typography wrapping `{timeAgo}`
- `frontend/src/components/dashboard/hero-memory.tsx` line 154 Typography wrapping `{postedDate}`
- `frontend/src/components/post/post-detail.tsx` line 928 Typography wrapping the date span

**Fix 2 — HIGH: White text on gold button in settings (dark mode)**

The "Save Changes" and "Change Password" buttons are the primary CTAs on the settings
profile and account tabs. In dark mode they render white text on gold (#E2BC5C), a
~1.95:1 contrast ratio. Users who set up their profile (golden-path step: first post
needs a displayName/bio) in dark mode cannot comfortably read the save button label.

Smallest fix — remove `color: 'white'` on lines 402 and 988 of
`frontend/src/app/(app)/settings/page.tsx`. MUI will substitute `secondary.contrastText`
(`'#16121F'` in dark, `'#221C18'` in light) — both pass WCAG AA.

**Fix 3 — HIGH: `useActivityStream` mounted only on /activity page**

Real-time activity signals (new followers, comments) only propagate while the user sits
on /activity. Moving the hook to the (app) layout completes the realtime notification
infrastructure already built in this commit and unblocks the "view in feed" golden-path
step where a follow/save from another user should update the Bell without a page reload.

Smallest fix — add a thin `'use client'` wrapper component
`frontend/src/components/layout/activity-stream-mount.tsx` that calls
`useActivityStream()` and renders null, then add `<ActivityStreamMount />` inside
`frontend/src/app/(app)/layout.tsx` alongside the existing `<TravelAutoDetector />`.
