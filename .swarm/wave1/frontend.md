# Frontend Review — Wave 1
Branch: mvp/stabilize-auth-post-feed-profile
Reviewed: 2026-05-12

---

## CRITICAL

None found.

---

## HIGH

### H1 — Mock data silently masking real API failures in `/post/[id]/page.tsx`
**File:** `frontend/src/app/(app)/post/[id]/page.tsx:99`

```ts
const resolvedPost = post ?? getMockPost(id);
```

When `usePost` returns an error (network failure, 404, 401), `post` is `undefined`. `getMockPost(id)` then fills in stale mock data and the user sees fabricated content with no error indicator. The error guard on line 101 only fires when *both* the real query errored *and* the mock lookup also returned nothing — meaning for any ID that happens to match a mock fixture the error is completely swallowed. This is a correctness bug that will ship phantom data to production users.

---

### H2 — `useSavedPosts` fires unconditionally for every profile visit
**File:** `frontend/src/app/(app)/profile/[username]/page.tsx:89`

`useSavedPosts()` is called at the top of the component with no `enabled` guard. It issues a network request for the authenticated user's saved posts on *every* profile page visit, including when viewing another user's profile where the result is discarded (line 91–93). This leaks an authenticated endpoint call on every profile load, wastes bandwidth, and may return 401 errors for unauthenticated visitors that are silently swallowed.

Fix: wrap in `useInfiniteQuery` with `enabled: isOwnProfile` or gate the hook call below the `isOwnProfile` computation. Hooks cannot be called conditionally, so pass `enabled: isOwnProfile` to the query inside `useSavedPosts`, or restructure as a sub-component.

---

### H3 — "Saved" tab is shown to any authenticated user on someone else's profile
**File:** `frontend/src/app/(app)/profile/[username]/page.tsx:167`

```tsx
{(isOwnProfile || authUser) && (
  <MuiTab value="saved" ... />
)}
```

The condition `isOwnProfile || authUser` renders the Saved tab for *any logged-in user* on *any profile*. Clicking it then shows the "Saved posts are private" lock screen (line 336). This is confusing UX — the tab should only be visible on the own profile. Change the condition to `{isOwnProfile && (`.

---

### H4 — `animation: 'spin 1s linear infinite'` on `Loader2` in map page — keyframe not defined
**File:** `frontend/src/app/(app)/map/page.tsx:450`

```tsx
<Loader2 style={{ animation: 'spin 1s linear infinite' }} />
```

There is no `@keyframes spin` definition in `globals.css` or any imported stylesheet (Tailwind's `animate-spin` is not available — no Tailwind CSS config, only `tailwind-merge` as a utility). The spinner will render statically. The `MapControls` component inside `map.tsx` uses `className="animate-spin"` correctly (Tailwind class present via `tailwind-merge`?), but for the map loading overlay the inline style references an undefined keyframe. Replace with the Lucide `Loader2` + `className="animate-spin"` pattern used elsewhere, or define the keyframe in `globals.css`.

**Also:** The `ping` animation used on map marker ripples (`animation: 'ping 3s ...'`) at `frontend/src/app/(app)/map/page.tsx:186` has the same problem — `@keyframes ping` is not defined in any stylesheet.

---

### H5 — `console.error` left in production code in map component
**File:** `frontend/src/components/ui/map.tsx:812`

```ts
console.error("Error getting location:", error);
```

Per project rules and code quality checklist, `console.*` must not appear in committed code. Use a structured logger or silently swallow the geolocation denial (which is a user decision, not an error).

---

## MEDIUM

### M1 — `<img>` used for user-generated R2 content throughout — no `next/image`
**Files:**
- `frontend/src/app/(app)/profile/[username]/page.tsx:218,235`
- `frontend/src/app/(app)/map/page.tsx:207,264`
- `frontend/src/components/ui/map.tsx` (map marker images)

User-uploaded images served from Cloudflare R2 are rendered with bare `<img>` tags. Next.js `<Image>` provides lazy loading, automatic WebP conversion, and prevents layout shift. R2 URLs would need to be added to `next.config.ts` `images.remotePatterns`, but this is the correct approach. At minimum, map popup images (rendered inside MapLibre portals) are a known exception — note that explicitly, but the profile grid and marker circle images should use `<Image>`.

---

### M2 — Profile map duplicates the entire map tab implementation from `profile-map-tab.tsx`
**Files:**
- `frontend/src/app/(app)/profile/[username]/page.tsx:184–270`
- `frontend/src/app/(app)/profile/[username]/profile-map-tab.tsx`

The `profile-map-tab.tsx` component was created to extract the map tab, but `page.tsx` contains a full inline duplicate of the same JSX (marker rendering, popup content, `resolveImageUrl`, `mapboxStyleUrls`, etc.). The `ProfileMapTab` component is never imported or used in `page.tsx`. This is dead code that will diverge over time.

---

### M3 — `Post.locationLat` typed as `number` (non-nullable) but real API responses send `null`
**File:** `frontend/src/lib/types/index.ts:26–27`

```ts
locationLat: number;
locationLng: number;
```

The `mapPosts` filter (`p.locationLat && p.locationLng`) at `profile/[username]/page.tsx:79` is necessary precisely because these values *can* be null/zero from the API. The type should be `number | null` to match reality. As typed, TypeScript will not catch `Number(null)` passed to map center coordinates — which evaluates to `0` and silently centers the map on the equator/prime-meridian intersection.

---

### M4 — Sub-query errors (posts, albums, journals) not surfaced on profile page
**File:** `frontend/src/app/(app)/profile/[username]/page.tsx:67–109`

`postsLoading`, `albumsLoading`, `journalsLoading` are destructured but the corresponding `error` values are not. If any of these queries fail, the tab renders as empty with no user-visible indication of failure — indistinguishable from having no content. Add error destructuring and show an error state per tab.

---

### M5 — Hydration mismatch risk: `useResolvedTheme` initialises from DOM in `useState` initialiser
**File:** `frontend/src/components/ui/map.tsx:43–45`

```ts
const [detectedTheme, setDetectedTheme] = useState<"light" | "dark">(
  () => getDocumentTheme() ?? getSystemTheme()
);
```

`getDocumentTheme()` reads `document.documentElement.classList` during the initial render. In Next.js App Router with SSR, this runs only on the client (the component is `'use client'`), so there is no direct SSR mismatch here. However, MUI's theme uses `cssVariables: { colorSchemeSelector: 'data' }` (the `data` attribute), while `getDocumentTheme` checks for `class` (`classList.contains("dark")`). These will *never* agree — the MUI theme system sets `data-mui-color-scheme` on `<html>`, not a class. The map will always fall back to `getSystemTheme()` and never track MUI's dark mode toggle. This is a functional dark-mode bug on the map component.

---

### M6 — `ThemeProvider` from `next-themes` (attribute="class") is configured but never used
**File:** `frontend/src/lib/providers/theme-provider.tsx`

The `ThemeProvider` wrapper is defined with `attribute="class"` but is not included in the root layout (`src/app/layout.tsx`). MUI's own `ThemeProvider` with CSS variables handles theming. The orphaned file is misleading — it should either be deleted or its comment should note that it is unused.

---

### M7 — `feed/page.tsx` is a redirect-only stub with no loading state
**File:** `frontend/src/app/(app)/feed/page.tsx`

The feed page immediately redirects to `/explore` with no visual feedback. On slow connections the page flashes blank before navigating. Add a brief loading skeleton or use a server-side redirect (`redirect()` from `next/navigation` in a Server Component) to avoid the client-side flash.

---

### M8 — Home page FAB has no `aria-label` and is desktop-only with no mobile equivalent
**File:** `frontend/src/app/(app)/home/page.tsx:54–76`

The FAB (create post button) wrapping a `<Box>` with `display: { xs: 'none', md: 'flex' }` has no `aria-label`. The `<Link>` wrapper also lacks descriptive text for screen readers — `<Pencil>` icon with no label. Add `aria-label="Create new memory"` to the link or inner box.

On mobile, this FAB is hidden. The mobile path to create a post relies entirely on the bottom nav — confirm that `BottomNav` includes a create action.

---

### M9 — `useAuth` hook issues a network request (`getMe`) every render when `user` is null
**File:** `frontend/src/lib/hooks/use-auth.ts:11–18`

```ts
useEffect(() => {
  if (!user) {
    getMe().then(setUser).catch(() => {});
  }
}, [user, setUser]);
```

While the `[user, setUser]` dependency array is correct, this hook can be instantiated in multiple components simultaneously. Each instance will race to call `getMe()` independently when `user` is null (before the first response resolves). There is no deduplication, no pending flag, and the `.catch` block silently swallows all errors. Use TanStack Query (`useQuery` with `queryKey: ['me']`) or a singleton promise to deduplicate the `/me` fetch.

---

## LOW

### L1 — Magic number `bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))'` duplicated
**File:** `frontend/src/app/(app)/layout.tsx:30`

The bottom padding for mobile safe-area is a hardcoded value. If the bottom nav height changes, this must be updated in multiple places. Extract to a shared constant.

### L2 — `profile-map-tab.tsx` is an unconnected dead component
**File:** `frontend/src/app/(app)/profile/[username]/profile-map-tab.tsx`

The component is never imported anywhere in the codebase. It is either a leftover from a refactor attempt or the refactor was incomplete (see M2). Either wire it in or delete it.

### L3 — `resolveImageUrl` utility duplicated across three files
**Files:** `profile/[username]/page.tsx:40`, `profile-map-tab.tsx:22`, `map/page.tsx:30`

Identical function, copy-pasted three times. Extract to `frontend/src/lib/utils/url.ts`.

### L4 — `mapboxStyleUrls` is evaluated at module level using `process.env` — will be `undefined` if env is not set at build time
**Files:** `profile/[username]/page.tsx:45–50`, `profile-map-tab.tsx:27–32`, `map/page.tsx:35–40`

Module-level evaluation of `NEXT_PUBLIC_*` env vars is fine in Next.js (they are inlined at build time), but the result being `undefined` silently falls back to OpenFreeMap defaults with no developer-visible warning. Add a dev-time warning when the env var is absent.

### L5 — `usePostsFeed` query key is `['posts']` — same as the per-user posts query prefix
**File:** `frontend/src/lib/hooks/use-posts.ts:9`, `profile/[username]/page.tsx:71`

`usePostsFeed` uses `queryKey: ['posts']` and the profile page uses `queryKey: ['posts', 'user', user?.id]`. `invalidateQueries({ queryKey: ['posts'] })` in `useCreatePost`/`useDeletePost` will correctly invalidate both. This is acceptable but document the intent — it is easy to accidentally narrow the invalidation and miss the feed.

---

## Summary

TypeScript check passes with no errors. ESLint produced no output on the reviewed files. The two most impactful issues are: **H1** (mock data silently masking real API errors in the post detail page) and **H3/H2** (Saved tab shown to all authenticated users + unconditional saved-posts network call on every profile load). The dark-mode map regression (**M5**) will be immediately visible to users who switch themes. The undefined `spin`/`ping` keyframes (**H4**) mean the map loading spinner and all map marker ripples render as frozen elements.

