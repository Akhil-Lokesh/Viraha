# Wave 1 Synthesis — Prioritized for Wave 2

## CRITICAL — fix in Wave 2 (must)

Grouped by "fix cluster" to enable parallel atomic commits.

### Cluster A — Auth flow correctness (single commit)
**Owner: backend-auth-fixer**
- A1. Remove `validateBody(refreshTokenSchema)` from `/auth/refresh` (route reads cookie, body validator rejects empty body). Delete `refreshTokenSchema` from validators. **File: backend/src/routes/auth.ts:18, backend/src/validators/authValidators.ts:15-17**
- A2. Switch `/auth/logout` from `authenticate` → `optionalAuth` (handler already null-safe; current behavior breaks logout when access token expired). **File: backend/src/routes/auth.ts:19**
- A3. Stabilize CSRF session identifier — don't use `viraha_access` (rotates every 15min causing spurious 403s). Use a stable per-user identifier from refresh-token JTI or set a dedicated `viraha_session_id` cookie at login. **File: backend/src/middleware/csrf.ts:9**
- A4. Delete expired refresh tokens from DB when rejected. **File: backend/src/controllers/authController.ts:188-194**
- A5. Sanitize `req.body` for Prisma `update` in `updateProfile` (destructure allowed fields). **File: backend/src/controllers/userController.ts:122**
- A6. Type `sanitizeUser(user: any)` → `Prisma.User` or delete function and use `select` everywhere. **File: backend/src/controllers/authController.ts:10**

### Cluster B — Comments + album privacy (security)
**Owner: backend-privacy-fixer**
- B1. Apply privacy gate in `getComments` and `getReplies` (currently leaks comments on private/followers posts). **File: backend/src/controllers/commentController.ts:80-151**
- B2. Filter individual post privacy in `getAlbumPosts` response. **File: backend/src/controllers/albumController.ts:421-486**
- B3. Reject cross-user post addition in `addPostToAlbum`. **File: backend/src/controllers/albumController.ts:297-366**

### Cluster C — Frontend profile/post functional bugs
**Owner: frontend-feature-fixer**
- C1. Backend: read `req.query.userId` in `getPosts` and apply to `where` (profile Posts tab currently shows global feed). **File: backend/src/controllers/postController.ts:13-58**
- C2. Frontend: broaden auth redirect-loop guard from `'/sign-'` to all auth pages including `/forgot-password` and `/reset-password`. **File: frontend/src/lib/api/client.ts:84**
- C3. Frontend: add empty-array guard to `ProfileMapTab` (currently crashes on `posts[0].locationLng` when empty). **File: frontend/src/app/(app)/profile/[username]/profile-map-tab.tsx:43**
- C4. Backend: fix `/users/:userId/followers` and `/users/:userId/following` — currently expect UUID but frontend sends username. Either resolve username→userId in controller or rename param. **File: backend/src/routes/users.ts:24-25, backend/src/controllers/followController.ts**
- C5. Frontend: `PrivacyTab` shows `showLocation=true` regardless of server state. Initialize from `useAuthStore().user.showLocation`. **File: frontend/src/app/(app)/settings/page.tsx:467**
- C6. Frontend: `useFollowUser/useUnfollowUser` must invalidate `['feed']` query, not just `['follows']`/`['users']`. **File: frontend/src/lib/hooks/use-follows.ts:18-22**

### Cluster D — Code hygiene (CLAUDE.md violations)
**Owner: frontend-cleanup-fixer**
- D1. Remove `console.error` in `frontend/src/components/ui/map.tsx:812`.
- D2. Remove `console.error` in `frontend/src/app/(app)/journals/[id]/page.tsx:146`.
- D3. Replace `where: any` in postController.ts, albumController.ts, journalController.ts, mapController.ts with `Prisma.*WhereInput` types.

---

## HIGH — fix in Wave 2 if time, else Wave 3

### Cluster E — UX / navigation (click-path fixes)
- E1. Add Bookmark/Saved nav item to sidebar. **File: frontend/src/components/sidebar.tsx:23-31**
- E2. Post detail back button: use `router.back()` with fallback. **File: post-detail.tsx:163-164**
- E3. Sign-up redirects to `/home` (not `/`). **File: (auth)/sign-up/page.tsx:105**
- E4. CreatePost form: reject default (0,0) coordinates or require location pick. **File: components/post/create-post-form.tsx:69-73**
- E5. Map marker pin opens BOTH popup and drawer — pick one. **File: map/page.tsx:471**
- E6. Dead buttons: PostCard `MoreHorizontal`, PostDetail `Share2`, UserProfileHeader `Message` — remove or implement (Share = clipboard copy).
- E7. Comment submit failure shows no toast. **File: post-detail.tsx:92-105**
- E8. PrivacyTab — no confirmation prompt on private toggle.

### Cluster F — Security hardening
- F1. Require CSRF_SECRET in production; add to placeholder check. **File: backend/src/config/env.ts:21**
- F2. Allowlist `mediaUrls` to R2 domain. **File: backend/src/validators/postValidators.ts:5**
- F3. Remove `'style'` from DOMPurify ALLOWED_ATTR (XSS via CSS exfil). **File: frontend/src/lib/utils/sanitize-html.ts:14**
- F4. Add `Strict-Transport-Security` header to Next.js `headers()`. **File: frontend/next.config.ts:34-47**
- F5. Don't persist user `email` in Zustand `localStorage`. **File: frontend/src/lib/stores/auth-store.ts:13-33**

### Cluster G — Counters and caching
- G1. Increment/decrement `commentCount` / `saveCount` in commentController and saveController. **File: backend/src/controllers/commentController.ts, saveController.ts**
- G2. Add Redis cache to `getPersonalizedFeed` (5min TTL, invalidate on post create/delete). **File: backend/src/controllers/feedController.ts**

### Cluster H — useAuth + CSRF prefetch hardening
- H1. Migrate `useAuth` hook to TanStack Query (dedupe parallel `/auth/me` calls). **File: frontend/src/lib/hooks/use-auth.ts**
- H2. Consolidate CSRF token fetch — fetch once on app init, not 3× per sign-in. **File: components/auth/csrf-initializer.tsx, (auth)/sign-in/page.tsx**

---

## Wave 2 dispatch plan

7 parallel agents, each with a focused remit, atomic commit per agent:

1. `backend-auth-fixer` — Cluster A (6 fixes in 4 files)
2. `backend-privacy-fixer` — Cluster B (3 fixes)
3. `frontend-feature-fixer-1` — Cluster C subset (C1, C2, C3, C5)
4. `frontend-feature-fixer-2` — Cluster C subset (C4, C6) — depends on C1 from #1's fixer working? No, independent
5. `code-hygiene-fixer` — Cluster D (3 fixes)
6. `ux-navigation-fixer` — Cluster E1, E2, E3, E6, E7 (avoid E4 if scope creeps)
7. `security-hardening-fixer` — Cluster F1, F3, F4, F5 (skip F2 — would need R2 env, scope creep)

Then Wave 3:
- TypeScript check + frontend build + linter
- Re-review each commit
- Spot-check fixes verify by reading the changed file end-to-end

---

## Test infrastructure gaps (track separately — user said "main logic now")

- Backend test DB at port 5434 not running (needs Docker — user can start)
- Frontend vitest pool times out — likely `withSentryConfig` ESM import. Workaround: `pool: 'vmThreads'` or `singleFork: true` in `vitest.config.ts`.
- 4 critical regression test gaps from recent fixes (auth-guard, CSRF prefetch, CSRF middleware, redirect-loop guard).

Move to Wave 4 self-improvement notes — don't block Wave 2 on test infra.
