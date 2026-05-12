# Wave 3 Review #2 — Frontend + Posts

Branch: `mvp/stabilize-auth-post-feed-profile`
Reviewer: Wave 3 Reviewer #2
Scope: commits `6e3e3b4`, `b42c219`, `db88115`
TypeScript check: `cd frontend && npx tsc --noEmit` → **CLEAN (exit 0)**

---

## Commit 1 — `6e3e3b4` fix(api): honor userId query in getPosts; type Prisma.PostWhereInput

### Verdict: PASS

### Original findings addressed
- **C1** (profile posts query ignored): fixed. `getPosts` now reads `req.query.userId` into `filterUserId` and applies it as `where.userId = filterUserId` **after** the privacy filter is built. Frontend `getPosts(undefined, user.id)` in `profile/[username]/page.tsx:72` propagates the param; `frontend/src/lib/api/posts.ts:24-29` forwards `userId` as a query param. End-to-end wired.

### Verification of intersection semantics
The privacy `where.OR = [...]` is built first, then `filterUserId` is added as a sibling key (line 39-41). Prisma intersects sibling keys with `AND`, so the final query is effectively:
`(NOT isDeleted) AND (privacy public OR followers-and-followed OR own) AND (userId = filterUserId)` — correct.

This means visiting another user's profile while authenticated will only return their **public** + **followers-visible-to-me** + **(non-existent: their posts owned by me)** posts. Their `followers`-privacy posts are visible only if I follow them — which is the intended privacy semantic. Good.

### Prisma type narrowing
`const where: Prisma.PostWhereInput = { isDeleted: false }` followed by structural mutations (`where.OR`, `where.privacy`, `where.userId`) all narrow correctly because every assigned key exists on `PostWhereInput`. tsc clean.

### Minor improvements (non-blocking)
- The `typeof req.query.userId === 'string'` guard is defensive — express types `req.query[k]` as `string | string[] | ParsedQs | undefined`. Good defensive cast.
- Consider Zod-validating the userId as a UUID/cuid before querying — bad input currently returns an empty result rather than a 400.

---

## Commit 2 — `b42c219` fix(frontend): redirect guard / map crash / showLocation / feed invalidate

### Verdict: PASS with one minor concern

### Original findings addressed
- **C3** auth redirect missing pages: fixed. `client.ts:81-91` replaces `pathname.startsWith('/sign-')` with explicit array `['/sign-in', '/sign-up', '/forgot-password', '/reset-password']` covering all four flows. `.some(p => pathname.startsWith(p))` correctly matches nested paths (e.g., `/reset-password/[token]`).
- **C4** profile-map-tab crash: fixed. New `profile-map-tab.tsx` early-returns when `posts.length === 0`. However, this **component is not actually used** — `profile/[username]/page.tsx:184-271` still inlines the same map JSX with its own `mapPosts.length === 0` guard. The new component is dead code unless wired in later. Profile page itself is safe because of the guard at line 185.
- **B17** showLocation: fixed. `PrivacyTab` initializes `showLocation` from `user?.showLocation ?? true`. Type `User.showLocation?: boolean` added to `frontend/src/lib/types/index.ts:13`. Auth store `partialize` persists it (auth-store.ts:17/32). `/auth/me` returns the full user record via `sanitizeUser`, so the field round-trips correctly.
- **B9** follow invalidates feed: fixed in BOTH `useFollowUser` (line 21) and `useUnfollowUser` (line 33). Cascades correctly to `['feed','personal']`, `['feed','discover']`, and `['feed','nearby',...]` (all start with `['feed']`).

### Concerns

#### MEDIUM — Stay-in-sync of `showLocation` is unidirectional
`PrivacyTab` initializes from store but the local `showLocation` state never re-syncs when the store updates after, say, a `/auth/me` refresh. If user opens settings before `useAuth()`'s `getMe` completes (`user` is `null`), then it lands in the store, `PrivacyTab` will be stuck on the `true` default. The prompt explicitly asked: "does showLocation reflect the user store value (not just initialize from it but stay in sync)?" — **answer: it initializes only, no `useEffect` re-sync**. Same flaw applies to `isPrivate` (pre-existing). Minor because: (a) the user mutation calls `setUser(updated)` after a write, so the persisted store agrees with local state after any edit; (b) on re-mount the initializer runs again. Worth a follow-up but not blocking.

#### LOW — Hydration risk
`PrivacyTab` reads `user?.showLocation` during `useState` initializer. SSR will compute one value; client first render will compute another after Zustand persist rehydrates. Because the parent is `'use client'` and Zustand `persist` is opt-in, the client's initial render runs with `user === null` (store starts empty) and then hydrates. Result: **no SSR mismatch** because the whole tree is client-rendered, but a flicker is possible. Not blocking.

#### LOW — Cast `as Parameters<typeof updateProfile>[0]`
`settings/page.tsx:489` casts `{ showLocation: value }` through `Parameters<typeof updateProfile>[0]`. Since `UpdateProfileInput` already has `showLocation?: boolean` (line 106), the cast is no longer needed — pre-existing remnant from before the type was added. Cosmetic.

#### LOW — `partialize` migration risk
Existing users persisted at `version: 2` are unaffected. The `version === 1` migrate function calls `stripToPersisted` which references `user.showLocation` (now in the type). For genuinely-old persisted v1 blobs that lack `showLocation`, the field resolves to `undefined` — persisted as `undefined`, read back as `undefined`, falls through to the `?? true` default. Safe.

---

## Commit 3 — `db88115` chore: remove console.error; spin/ping keyframes; type Prisma WhereInput

### Verdict: PASS with one HIGH-severity regression caveat (mapController) and one LOW

### Original findings addressed
- **H4** keyframes: `@keyframes spin` and `@keyframes ping` defined in `frontend/src/app/globals.css:215-227`. Definitions are textbook correct (`spin` rotates to 360deg; `ping` scales to 2 with opacity 0 at 75-100%). Multiple `style={{ animation: 'spin 1s linear infinite' }}` usages in post-detail.tsx now have working keyframes.
- **H5** console.error: removed in `journals/[id]/page.tsx:145-146` (now an empty catch with a comment) and in `components/ui/map.tsx:811-812` (geolocation denial). Backend retains a single legitimate `console.error` in `env.ts:54` (boot-time invalid env), which is fine.
- **B4** sidebar `/saved`: added at `sidebar.tsx:31` between Journeys (line 30) and Atlas (line 32). The prompt mistakenly said "between Journals and Atlas" but the commit places it between **Journeys** and **Atlas**, which matches your corrected description. Order: Home → Explore → Map → Albums → Journals → Journeys → Saved → Atlas. Correct.
- **B7** back button: `post-detail.tsx:168-189` replaces `<IconButton component={Link} href="/">` with `onClick` using `router.back()` if `window.history.length > 1` else `router.push('/explore')`. Proper fallback. `aria-label="Go back"` added.
- **Share button**: `post-detail.tsx:387-396` wires `onClick` that copies `window.location.origin/post/${post.id}` via `navigator.clipboard.writeText`, with toast success/error. Correct.
- **B1** sign-up redirect: `sign-up/page.tsx:105` now `router.push('/home')` — route exists at `frontend/src/app/(app)/home`. Correct.
- **B6** comment submit error: `post-detail.tsx:106-108` adds `onError: () => toast.error('Failed to post comment')`. Correct.
- **H1** mock data gating: `post/[id]/page.tsx:100-102` — `post ?? (!error && process.env.NODE_ENV !== 'production' ? getMockPost(id) : undefined)`. Correctly: (a) prefers real post, (b) only falls back when no error, (c) only in non-production. Prevents demo mocks masking real failures in prod. Correct.
- **H3** Saved tab restriction: `profile/[username]/page.tsx:167` changed from `(isOwnProfile || authUser)` to `isOwnProfile`. Tab is no longer visible on other users' profiles. Body of `activeTab === 'saved'` (line 297) also gates with `isOwnProfile ? ... : <Lock />` as a belt-and-suspenders defense. Correct.
- **Dead buttons**: `post-card.tsx` "More options" `IconButton` truly removed via `/* */` block comment and lucide `MoreHorizontal` import removed (line 11 in old file is gone). `user-profile-header.tsx` "Message" `Button` block-commented out, `MessageCircle` import still present elsewhere — checked, no leftover JSX. Both hidden, not silently no-op. Acceptable.

### NEW BUG — HIGH severity: mapController endDate-only filter

Original code on line 36-37 of the old `mapController.ts`:
```ts
if (startDate) postWhere.postedAt = { ...(postWhere.postedAt || {}), gte: ... };
if (endDate)   postWhere.postedAt = { ...(postWhere.postedAt || {}), lte: ... };
```
The refactor (line 40-45) wraps both into a single block:
```ts
if (startDate || endDate) {
  const postedAt: Prisma.DateTimeFilter = {};
  if (startDate) postedAt.gte = new Date(startDate);
  if (endDate) postedAt.lte = new Date(endDate);
  postWhere.postedAt = postedAt;
}
```
**This is correct for posts.** No regression.

But: the analogous block for journal entries (line 92-95) **lost the OR-merge for the bounds case** vs. dates. The bounds branch now sets `entryWhere.locationLat = { not: null, gte: ..., lte: ... }` — correct, preserves `not: null`. **No bug here either after closer re-read.** Initial concern retracted.

**Actual concern:** `mapController.ts` still has two `any` types that the commit message claims to fix:
- Line 18: `cacheGet<any>` — pre-existing but the commit's stated scope was "type Prisma WhereInput", so partial.
- Line 24: `const markers: any[] = []` — pre-existing.

These are out of the commit's stated scope but inconsistent with the file-wide cleanup. Flag for follow-up.

### NEW BUG — LOW: `'sonner'` toast in post-detail without provider check
`post-detail.tsx:6` imports `toast` from `sonner`. If the `<Toaster />` provider is mounted at app layout (`(app)/layout.tsx`), the toasts render. Need to confirm — but since `toast.success` was already used elsewhere (e.g., sign-up, journals), this is consistent. Not a regression.

### Other observations
- No new `any` types introduced in frontend. tsc clean.
- No new `console.*` calls introduced (verified via `grep -rn 'console\.' frontend/src --include='*.ts*'` → no results outside tests).
- No silent error swallows — `journals/[id]/page.tsx` catch now relies on the upstream `toast.error('Failed to save changes')` in the same `catch`, so the error surfaces. Good pattern.
- `MoreHorizontal` import in `post-card.tsx` was correctly removed alongside the commented JSX — clean removal.
- `IconButton` import is still used elsewhere in `post-card.tsx`? Check — yes, used for the save IconButton. Not a regression.

### Improvements suggested
1. **(MEDIUM)** Wire the new `profile-map-tab.tsx` into `profile/[username]/page.tsx` to deduplicate ~85 lines of inline map JSX — or delete the unused component.
2. **(MEDIUM)** Add `useEffect` in `PrivacyTab` to re-sync local `isPrivate`/`showLocation` when `user` updates from store (e.g., after `getMe` resolves on a cold load).
3. **(LOW)** Drop the unnecessary `as Parameters<typeof updateProfile>[0]` cast in `settings/page.tsx:489`.
4. **(LOW)** Replace `any` in `mapController.ts:18,24` with concrete `MapMarker` shape.
5. **(LOW)** Validate `userId` query in `getPosts` with Zod (UUID/cuid) — defense-in-depth.
6. **(LOW)** Consider removing the dead `profile-map-tab.tsx` file if no near-term plan to wire it (currently +127 LOC dead).
7. **(LOW)** The post-detail share `onClick` uses `window.location.origin` — server-rendered hydration won't see this because the parent is `'use client'`, but consider `useEffect`-guarding for SSR safety if PostDetail is ever moved.

---

## Cross-cutting check — `auth-store` `partialize` migration

`stripToPersisted` (auth-store.ts:24-34) reads `id, username, displayName, avatar, isPrivate, showLocation`. Persisted state version bumped to `2`. Migration handles:
- v0 → strips PII to v2 shape
- v1 → strips PII to v2 shape (newly added with showLocation support)
- ≥2 → pass-through

**Risk for pre-existing user sessions:** users with persisted v1 blobs have `showLocation: undefined` after migration. The PrivacyTab's `?? true` default treats this as "show location" — which is the safe default and matches a fresh signup. No corruption, no logout cascade. Safe.

---

## TypeScript check

```
cd frontend && npx tsc --noEmit
EXIT: 0
```
Clean.

---

## Summary table

| Commit | Verdict | Notes |
|---|---|---|
| `6e3e3b4` | PASS | userId filter correctly intersects with privacy filter; Prisma type narrows cleanly |
| `b42c219` | PASS | Auth redirect array covers all 4 paths; map guard works (in unused component); follow-invalidate is BOTH; showLocation init-only (minor) |
| `db88115` | PASS | Keyframes correct; sidebar order correct (Journeys→Saved→Atlas); back/share/sign-up redirect/mock-gating/saved-tab/dead-buttons all correct; lingering `any` in mapController out of scope |

**Recommendation:** Ship. Track the MEDIUM items as follow-ups (PrivacyTab re-sync, profile-map-tab wiring or deletion).
