# Wave 1 — Architecture Audit

## CRITICAL (will break in prod)

### C1 — `POST /auth/refresh` validates a body field that is never sent
- `backend/src/routes/auth.ts:18` applies `validateBody(refreshTokenSchema)`, which requires a `refreshToken` string in the body.
- `authController.ts:156` reads only from `req.cookies.viraha_refresh`. The frontend `client.ts:73` sends an empty body `{}`.
- Zod returns 400 on every token refresh → re-auth broken for all users.
- **Fix**: remove `validateBody(refreshTokenSchema)` from the refresh route; delete the schema.

### C2 — `POST /logout` requires `authenticate` but access cookie is 15 min TTL
- A user with an expired access token cannot log out — the refresh interceptor in `client.ts` fires but `/logout` isn't on the exclusion list, causing an infinite retry before the 401 bubbles.
- **Fix**: switch `/logout` to `optionalAuth` — the handler already guards refresh-token deletion with `if (refreshToken)`.

### C3 — CSRF session identifier uses the access token cookie → rebinding window
- `backend/src/middleware/csrf.ts:9` — `getSessionIdentifier` returns `req.cookies.viraha_access`.
- When the access token rotates (every 15 min), CSRF tokens issued under the old identifier become invalid → spurious 403s on mutation requests for ~5–10s after refresh.
- **Fix**: use a stable per-user identifier (refresh token prefix or a separate stable `viraha_session_id` cookie set at login).

### C4 — `updateProfile` passes raw Zod-validated body directly to Prisma `data`
- `backend/src/controllers/userController.ts:122` — `prisma.user.update({ data })` with `data = req.body as UpdateProfileInput`.
- The cast bypasses Zod parsing's strip behavior. If the validator allows a superset later, arbitrary columns become writable.
- **Fix**: destructure only the allowed fields before passing to Prisma, or use `userSchema.parse(req.body)` directly to guarantee stripping.

---

## HIGH (will block Phase 3)

### H1 — Personalized feed has zero caching
- `backend/src/controllers/feedController.ts:12–68` — `getPersonalizedFeed` runs 3 unbounded Postgres queries per request per user. `cacheGet`/`cacheSet` are imported but unused in this function.
- **Fix**: add a `feed:{userId}` key with a 5-min TTL; invalidate on post create/delete.

### H2 — `commentCount` / `saveCount` are schema fields written by nothing
- `backend/prisma/schema.prisma:75–76` — both have `@default(0)`. No controller increments them.
- `getPersonalizedFeed` and `getPosts` return these fields; frontend `types/index.ts:37` surfaces them. **Users always see 0.**
- **Fix**: increment/decrement via `prisma.post.update({ data: { commentCount: { increment: 1 } } })` in commentController and saveController.

### H3 — Followers / Following endpoints take a UUID param but frontend sends username
- `backend/src/routes/users.ts:24–25` — routes `/users/:userId/followers` and `/users/:userId/following`.
- The follow controller queries `where: { followingId: userId }` treating the param as a UUID.
- Frontend `lib/api/users.ts` calls `/users/${username}/followers` (username, not UUID) because profile pages are username-keyed → empty results forever.
- **Fix**: resolve username to userId in the controller, or change the route param name.

### H4 — `redis.keys(pattern)` blocks the Redis event loop
- `backend/src/lib/cache.ts:43` — `redis.keys(pattern)` scans the entire keyspace.
- Not on hot paths today, but explore cache invalidation will need it as posts grow.
- **Fix**: switch to `SCAN` with a cursor, or track managed keys in a Redis Set.

### H5 — `/auth/csrf-token` not protected by `authLimiter`
- `backend/src/app.ts:102–104` — `authLimiter` is mounted on `/auth` AFTER `apiLimiter` (200/15min) on `/api/v1`. The `/auth/csrf-token` route is mounted before CSRF protection, so token farming is rate-limited only by the general limiter at 200/15min — effectively open.
- **Fix**: apply `authLimiter` explicitly to `/auth/csrf-token`.

---

## MEDIUM (worth fixing soon)

### M1 — Hydration guard renders a black div during SSR (visible flash)
- `frontend/src/components/auth/auth-guard.tsx:19` — while `!hydrated`, a full-viewport black div renders.
- **Fix**: replace with a skeleton matching the app shell layout.

### M2 — `useAuth` fans out parallel `/auth/me` calls (root cause of redirect loop)
- `frontend/src/lib/hooks/use-auth.ts:11–18` — bare `useEffect` calls `getMe()` whenever `user` is null. Multiple components mounting simultaneously fan out parallel requests.
- **Fix**: migrate to TanStack Query `useQuery` — its deduplication collapses concurrent requests to one.

### M3 — `sanitizeUser` uses `any` to strip `passwordHash`
- `backend/src/controllers/authController.ts:10` — `function sanitizeUser(user: any)`. Inconsistent with `userController.ts` which uses Prisma `select`.
- **Fix**: standardize on explicit `select` in all user-returning queries, delete `sanitizeUser`.

### M4 — `where: any` in `getPosts`
- `backend/src/controllers/postController.ts:18` — `const where: any = { isDeleted: false }`.
- **Fix**: use `Prisma.PostWhereInput`.

### M5 — `refreshTokenSchema` validator is misleading dead code (see C1).

### M6 — CSRF token fetched THREE times during sign-in with silent error swallowing
- `frontend/src/components/auth/csrf-initializer.tsx:8`, `(auth)/sign-in/page.tsx:54, 69` — fetched in initializer + useEffect + onSubmit.
- **Fix**: fetch once in CsrfInitializer, surface errors to the caller, remove duplicates.

### M7 — Comment/save routes mounted at bare `/api/v1` prefix
- `backend/src/app.ts:116–117` — namespace collision risk with other route groups.
- **Fix**: mount under a sub-prefix consistent with other routers.

---

## LOW (note only)

- **L1**: `CSRF_SECRET` falls back to `JWT_SECRET` — defence-in-depth gap.
- **L2**: `prisma.ts` singleton guard uses `globalThis` (Next.js pattern, dead code in Express).
- **L3**: `exploreController.ts` uses `cacheGet<any>` — bypasses type safety.
- **L4**: `noSsr` on MUI ThemeProvider — every page ships unstyled HTML until JS hydrates.
- **L5**: local `/uploads/` static route remains active in prod — verify storage module fails closed when R2 is absent.

---

## Summary (architect's verbatim summary)

Two production-breaking auth bugs (C1 refresh validator, C2 logout requires auth), one CSRF rebinding window every 15min (C3), and an unsafe Prisma write in updateProfile (C4). High-priority gaps: feed has no caching despite infra (H1), social counters never written (H2), follower endpoints take UUID but frontend sends username (H3). The recent Zustand hydration fix is architecturally sound but the `useAuth` hook still fans out parallel `/auth/me` calls — the correct fix is TanStack Query (M2). CSRF token is fetched three times during sign-in with silent error swallowing (M6).
