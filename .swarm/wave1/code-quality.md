# Code Quality Review — Wave 1
Branch: mvp/stabilize-auth-post-feed-profile
Scope: auth stabilization commits + touched files

---

## CRITICAL

### C1 — backend/src/controllers/postController.ts:13 — `userId` query param silently ignored
The frontend sends `?userId=<id>` when loading a user's profile posts (`getPosts(undefined, user.id)` in `frontend/src/lib/api/posts.ts:27`). The backend `getPosts` handler reads `req.query.limit` and `req.query.cursor` but never reads `req.query.userId`, so the profile Posts tab always returns the full global feed instead of the target user's posts.
```ts
// frontend/src/lib/api/posts.ts:27 sends: params.userId = userId
// backend/src/controllers/postController.ts:15-16 — userId never read from req.query
const limit = Math.min(Number(req.query.limit) || 20, 50);
const cursor = req.query.cursor as string | undefined;
// ← req.query.userId never consumed
```
Fix: add `const filterUserId = req.query.userId as string | undefined;` and append `...(filterUserId && { userId: filterUserId })` to the `where` clause after privacy checks.

### C2 — backend/src/controllers/authController.ts:10 — `sanitizeUser` typed `any`
```ts
function sanitizeUser(user: any) {
```
`any` disables type safety on a security-critical function that strips `passwordHash` before sending the user object to clients. If the Prisma `User` type changes (e.g., a new sensitive field is added), TypeScript will not warn that the field is being exposed.
Fix: type the parameter as `Prisma.User` or the generated Prisma user type.

### C3 — frontend/src/lib/api/client.ts:84 — auth redirect misses `/forgot-password` and `/reset-password`
```ts
!window.location.pathname.startsWith('/sign-')
```
The 401 interceptor only skips the redirect for paths starting with `/sign-`. A user on `/forgot-password` or `/reset-password` who triggers a 401 (e.g., an expired CSRF prefetch) will be redirected to `/sign-in`, causing a loop or confusing navigation.
Fix: broaden the guard: `['/sign-', '/forgot-password', '/reset-password'].some(p => window.location.pathname.startsWith(p))`.

### C4 — frontend/src/app/(app)/profile/[username]/profile-map-tab.tsx:43 — unsafe `posts[0]` access
```ts
center={[
  Number(posts[0].locationLng),
  Number(posts[0].locationLat),
]}
```
`ProfileMapTab` receives a `posts` prop that the caller guarantees is non-empty, but the component itself has no guard. If it is ever rendered with an empty array (defensive render or future caller mistake), this will throw a runtime error and crash the map tab.
Fix: add `if (posts.length === 0) return null;` at the top of the component.

---

## HIGH

### H1 — backend/src/controllers/postController.ts:18 — `where: any`
```ts
const where: any = { isDeleted: false };
```
Same pattern repeats in `albumController.ts:56`, `journalController.ts:70`, `mapController.ts:27,73`. Use `Prisma.PostWhereInput` (or the appropriate generated type) instead of `any`.

### H2 — frontend/src/lib/hooks/use-auth.ts:15 — silent error swallow in `getMe`
```ts
.catch(() => {
  // Not authenticated or token expired
});
```
This swallows all errors including network failures, which are indistinguishable from a genuine "not authenticated" state. A network error will silently keep `user` as `null`, causing the `AuthGuard` to redirect to `/sign-in` even when the user may be authenticated. At minimum, distinguish `401` from other errors.

### H3 — backend/src/controllers/authController.ts:55 — welcome email failure fully silent
```ts
sendWelcomeEmail(email, username).catch(() => {});
```
Fire-and-forget is acceptable here, but a completely empty catch means email delivery failures leave no trace. This should at minimum log to a server-side logger (not `console`).

### H4 — backend/src/controllers/postController.ts:271 — media deletion failure fully silent
```ts
Promise.allSettled(allUrls.map((url) => deleteFile(url))).catch(() => {});
```
`Promise.allSettled` already swallows individual rejections; the outer `.catch(() => {})` then swallows any error from `allSettled` itself. Storage orphans will accumulate with no signal. Log at minimum.

### H5 — frontend/src/app/(app)/profile/[username]/page.tsx:167 — "Saved" tab visible to all authenticated users
```tsx
{(isOwnProfile || authUser) && (
  <MuiTab value="saved" ... />
)}
```
The tab renders for any logged-in visitor of another user's profile. The tab content correctly shows a "private" lock screen, but this is still an unnecessary UI affordance and creates confusing UX. The condition should be `isOwnProfile` only.

### H6 — frontend/src/app/(app)/profile/[username]/page.tsx and profile-map-tab.tsx — duplicated map setup code (dead component)
`profile-map-tab.tsx` is an untracked file that duplicates `MAPBOX_TOKEN`, `API_BASE`, `resolveImageUrl`, and `mapboxStyleUrls` verbatim from `page.tsx`. It is not imported anywhere. Either adopt it (replacing the inline map in `page.tsx`) or delete it. Dead untracked code creates confusion.

### H7 — frontend/src/app/(app)/profile/[username]/page.tsx — `ProfilePage` component is ~310 lines of JSX
The entire page including skeleton, error state, tabs, map markers, and saved posts logic lives in one component. It exceeds the 50-line function guideline significantly. The map tab and skeleton should be extracted.

### H8 — frontend/src/components/ui/map.tsx:812 — `console.error` in committed code
```ts
console.error("Error getting location:", error);
```
CLAUDE.md explicitly forbids `console.*` in committed code.

### H9 — frontend/src/app/(app)/journals/[id]/page.tsx:146 — `console.error` in committed code
```ts
console.error('Journal save error:', err);
```
Same violation.

### H10 — frontend/src/app/page.tsx:27 — hardcoded hex in `style` prop
```ts
background: '#141218',
```
The same value is in `auth-guard.tsx:25` as a fallback inside a CSS variable string. `page.tsx` uses a raw hex directly — this should be `'var(--mui-palette-background-default)'` to stay in sync with the theme, and the hardcoded fallback in `auth-guard.tsx` should be removed or set to the same variable.

---

## MEDIUM

### M1 — frontend/src/app/(auth)/sign-up/page.tsx:70-74 — hardcoded hex colors for password strength
```ts
if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
```
Five hardcoded hex values used in `sx` `bgcolor`. Should use M3 theme tokens (`error.main`, `warning.main`, `success.main`, etc.).

### M2 — frontend/src/app/(auth)/sign-in/page.tsx:222 and sign-up/page.tsx:287 — password toggle button missing `aria-label`
```tsx
<IconButton onClick={() => setShowPassword(!showPassword)} edge="end" tabIndex={-1} size="small">
```
No `aria-label`. Screen readers cannot convey the button purpose. Add `aria-label={showPassword ? 'Hide password' : 'Show password'}`.

### M3 — frontend/src/lib/api/client.ts:17-19 — CSRF fetch failure completely silent
```ts
} catch {
  // CSRF token fetch failed — will retry on next mutation
}
```
This is the only intentional silent catch in the codebase (comment acknowledges it). It is acceptable as a best-effort prefetch, but `csrfToken` stays `null` and mutations will proceed without a CSRF header, which will be rejected by the server. The comment says "retry on next mutation" but there is no retry mechanism — mutations simply omit the header. Add a retry or document that the mutation will fail and the user must be notified.

### M4 — backend/src/controllers/authController.ts:188-194 — expired refresh token not deleted from DB
```ts
if (storedToken.expiresAt < new Date()) {
  res.status(401).json({ ... });
  return;
}
```
An expired token is found but not deleted. It will remain in the database indefinitely, accumulating across all users. Add `await prisma.refreshToken.delete({ where: { id: storedToken.id } })` before returning 401.

### M5 — backend/src/middleware/csrf.ts:9 — CSRF session identifier falls back to `'anonymous'`
```ts
getSessionIdentifier: (req) => req.cookies?.viraha_access || req.ip || 'anonymous',
```
If `req.ip` is undefined (proxy misconfiguration), all unauthenticated requests share the same CSRF secret key. This weakens CSRF protection for unauthenticated endpoints. At minimum, log a warning when both `viraha_access` and `req.ip` are absent.

### M6 — frontend/src/app/(app)/feed/page.tsx — redirect-only page with no loading state
```ts
export default function FeedPage() {
  useEffect(() => { router.replace('/explore'); }, [router]);
  return null;
}
```
`return null` causes a blank white flash on navigation. Return the same background-color `div` used elsewhere (`background: 'var(--mui-palette-background-default)'`) during the redirect.

### M7 — frontend/src/app/(app)/profile/[username]/page.tsx:34 — `MAPBOX_TOKEN` used in module-level URL template
```ts
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const mapboxStyleUrls = MAPBOX_TOKEN
  ? { light: `...?access_token=${MAPBOX_TOKEN}`, dark: `...?access_token=${MAPBOX_TOKEN}` }
  : undefined;
```
The Mapbox access token appears in constructed URLs at module scope. Since this is a `NEXT_PUBLIC_` env var it is intentionally client-visible, but it is duplicated identically in both `page.tsx` and `profile-map-tab.tsx`. Extract to a shared `lib/map-config.ts`.

---

## LOW

### L1 — frontend/src/app/(auth)/sign-in/page.tsx:74 — manual axios error shape casting
```ts
const errData = (err as { response?: { data?: { error?: { message?: string } | string } } })?.response?.data?.error;
```
Identical pattern in sign-up/page.tsx:107. Define a typed `ApiError` interface and a `parseApiError(err: unknown): string` helper to avoid repetition.

### L2 — frontend/src/app/(app)/profile/[username]/page.tsx:162 — MuiTabs `sx` prop is a single long line (~180 chars)
Inline sx object makes the tabs row difficult to read and diff. Extract to a named `const tabsSx = { ... }` above the component return.

### L3 — backend/src/controllers/feedController.ts:79 — `any[]` in cache generic
```ts
const cached = await cacheGet<{ items: any[]; nextCursor: string | null }>(cacheKey);
```
Type as `{ items: (Post & { isSaved: boolean })[]; nextCursor: string | null }` or a defined interface.

---

## Summary

**4 critical, 10 high, 7 medium, 3 low issues found.**

The most impactful bugs are C1 (profile Posts tab shows global feed instead of user's posts — functional regression), C3 (incomplete auth redirect guard misses `/forgot-password` and `/reset-password`), and C4 (potential runtime crash in `ProfileMapTab` on empty array). C2 (`sanitizeUser: any`) is a type-safety gap on a security-sensitive path. The `console.*` violations (H8, H9) breach CLAUDE.md rules directly. The `profile-map-tab.tsx` file (H6) is dead untracked code that duplicates logic verbatim from the page it was extracted from and is not wired in anywhere.
