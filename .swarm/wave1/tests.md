# Test Coverage Audit — Wave 1

## Current state: pass/fail counts per suite

### Backend (Vitest + supertest + test Postgres on port 5434)

| Suite | Tests | Result |
|---|---|---|
| auth.test.ts | 9 | FAIL — all 9 skipped (no DB) |
| posts.test.ts | 10 | FAIL — all 10 skipped (no DB) |
| feed.test.ts | 4 | FAIL — all 4 skipped (no DB) |
| follows.test.ts | 6 | FAIL — all 6 skipped (no DB) |
| journals.test.ts | 8 | FAIL — all 8 skipped (no DB) |
| albums.test.ts | 5 | FAIL — all 5 skipped (no DB) |
| validators.test.ts | 12 | FAIL — all 12 skipped (no DB) |

Root cause: `beforeAll` in `backend/src/__tests__/setup.ts` runs `npx prisma migrate deploy` targeting `localhost:5434`. No test Postgres instance is running. All 56 tests are marked skipped/failed. Zero tests pass.

### Frontend (Vitest + jsdom)

| Suite | Tests | Result |
|---|---|---|
| app.test.tsx | 1 | FAIL — worker timeout |
| api/client.test.ts | 3 | FAIL — worker timeout |
| stores/auth-store.test.ts | 4 | FAIL — worker timeout |
| stores/travel-store.test.ts | 5 | FAIL — worker timeout |
| dashboard/widget-registry.test.ts | ~20 | FAIL — worker timeout |
| utils/animations.test.ts | ~15 | FAIL — worker timeout |
| utils/cn.test.ts | unknown | FAIL — worker timeout |
| utils/sanitize-html.test.ts | 7 | FAIL — worker timeout |

Root cause: All 8 frontend test workers hit `[vitest-pool-runner]: Timeout waiting for worker to respond`. Likely a Next.js/ESM compatibility issue in the jsdom pool — zero tests pass.

### E2E (Playwright)

Not executed — requires running dev servers (backend on 4000, frontend on 3000). Status unknown from this audit. 5 spec files exist: auth.spec.ts (4 tests), navigation.spec.ts (7 tests), profile.spec.ts (3 tests), journal.spec.ts (3 tests), setup.spec.ts (1 test).

---

## CRITICAL gaps — recent fixes with no regression test

### GAP-C1: Hydration guard in AuthGuard never tested

**Fix applied in:** `48dba28`, `999db9d`
**File changed:** `frontend/src/components/auth/auth-guard.tsx`
**What it does:** Returns an opaque black div while Zustand store hydrates, then redirects to `/sign-in` once hydrated and unauthenticated. Without this guard, components render before the persisted token loads, causing a flash redirect loop.
**No test exists for:** (a) rendering while `hydrated=false` shows blocking div, not children; (b) redirects after hydration completes when unauthenticated; (c) renders children when both hydrated and authenticated.

**Add to:** `frontend/src/__tests__/components/auth-guard.test.tsx`

```tsx
it('should show blocking div while store is not hydrated', () => {
  vi.mocked(useAuthHydrated).mockReturnValue(false);
  vi.mocked(useAuthStore).mockReturnValue(null);
  render(<AuthGuard><span>Protected</span></AuthGuard>);
  expect(screen.queryByText('Protected')).not.toBeInTheDocument();
});
it('should redirect to /sign-in when hydrated but no user', async () => {
  vi.mocked(useAuthHydrated).mockReturnValue(true);
  vi.mocked(useAuthStore).mockReturnValue(null);
  render(<AuthGuard><span>Protected</span></AuthGuard>);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/sign-in'));
});
it('should render children when hydrated and user is present', () => {
  vi.mocked(useAuthHydrated).mockReturnValue(true);
  vi.mocked(useAuthStore).mockReturnValue({ id: '1' } as User);
  render(<AuthGuard><span>Protected</span></AuthGuard>);
  expect(screen.getByText('Protected')).toBeInTheDocument();
});
```

---

### GAP-C2: CSRF prefetch on auth pages never tested

**Fix applied in:** `48dba28`
**File changed:** `frontend/src/app/(auth)/sign-in/page.tsx` (and sign-up, forgot-password)
**What it does:** `useEffect(() => { fetchCsrfToken(); }, [])` is called on mount so the CSRF token is available before the first POST.
**No test exists for:** (a) `fetchCsrfToken` is called on mount; (b) `fetchCsrfToken` is called again immediately before `login()` in `onSubmit`; (c) the login call is NOT made when CSRF fetch fails.

**Add to:** `frontend/src/__tests__/app/(auth)/sign-in.test.tsx`

```tsx
it('should prefetch CSRF token on mount', async () => {
  render(<SignInPage />);
  await waitFor(() => expect(fetchCsrfToken).toHaveBeenCalledTimes(1));
});
it('should call fetchCsrfToken again before login on submit', async () => {
  render(<SignInPage />);
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'pw123');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(fetchCsrfToken).toHaveBeenCalledTimes(2);
});
```

---

### GAP-C3: CSRF middleware bypass never integration-tested

**What it does:** `app.ts` line 107–109 skips `doubleCsrfProtection` in `test` env. This means the middleware is never exercised by the test suite. A production regression where CSRF is misconfigured (wrong header name, wrong cookie) would not be caught.
**No test exists for:** POST without X-CSRF-Token returns 403 in a non-test environment.

**Add to:** `backend/src/__tests__/csrf.test.ts`

```ts
it('should reject POST /api/v1/posts without CSRF token when CSRF is active', async () => {
  process.env.NODE_ENV = 'production'; // or build a separate app instance
  const cookie = getAuthCookie(user.id);
  const res = await request(csrfApp).post('/api/v1/posts')
    .set('Cookie', cookie).send({ caption: 'test' });
  expect(res.status).toBe(403);
  process.env.NODE_ENV = 'test';
});
it('should accept POST with valid X-CSRF-Token header', async () => {
  const tokenRes = await request(csrfApp).get('/api/v1/auth/csrf-token');
  const token = tokenRes.body.data.csrfToken;
  const res = await request(csrfApp).post('/api/v1/posts')
    .set('X-CSRF-Token', token).set('Cookie', cookie).send({...});
  expect(res.status).toBe(201);
});
```

---

### GAP-C4: API client redirect-loop guard never tested

**Fix applied in:** `48dba28`
**File changed:** `frontend/src/lib/api/client.ts` lines 82–87
**What it does:** After a failed token refresh, the client only redirects to `/sign-in` if `window.location.pathname` does NOT already start with `/sign-`. Without this guard the interceptor could trigger a redirect loop from the sign-in page itself.
**No test exists for:** the no-redirect path when already on `/sign-*`.

**Add to:** `frontend/src/__tests__/api/client.test.ts`

```ts
it('should not redirect when already on /sign-in after refresh failure', async () => {
  Object.defineProperty(window, 'location', { value: { pathname: '/sign-in', href: '' }, writable: true });
  mockRefreshFail();
  await apiClient.get('/protected').catch(() => {});
  expect(window.location.href).not.toBe('/sign-in'); // no second assignment
});
it('should redirect to /sign-in from a protected page after refresh failure', async () => {
  Object.defineProperty(window, 'location', { value: { pathname: '/home', href: '' }, writable: true });
  mockRefreshFail();
  await apiClient.get('/protected').catch(() => {});
  expect(window.location.href).toBe('/sign-in');
});
```

---

## HIGH gaps — untested critical paths

### GAP-H1: Profile public/private switching

**No test for:** `PATCH /api/v1/users/me` setting `isPrivate: true` and verifying (a) the profile returns `isPrivate: true`, (b) subsequent follow requests for that user return `status: 'pending'` (not `'accepted'`), (c) private profile posts are excluded from discover feed.

**Add to:** `backend/src/__tests__/users.test.ts`

```ts
it('should switch profile to private and pending-gate follow requests', async () => {
  const owner = await createTestUser();
  const viewer = await createTestUser();
  await request(app).patch('/api/v1/users/me')
    .set('Cookie', getAuthCookie(owner.id)).send({ isPrivate: true });
  const res = await request(app)
    .post(`/api/v1/users/${owner.id}/follow`)
    .set('Cookie', getAuthCookie(viewer.id));
  expect(res.status).toBe(201);
  expect(res.body.data.follow.status).toBe('pending');
});
```

---

### GAP-H2: Soft delete does not appear in feed

**Existing test** in `posts.test.ts` verifies a deleted post 404s on direct GET. But there is no test verifying that a soft-deleted post is excluded from `GET /api/v1/feed` or `GET /api/v1/feed/discover`.

**Add to:** `backend/src/__tests__/feed.test.ts`

```ts
it('should exclude soft-deleted posts from the personalized feed', async () => {
  const user = await createTestUser();
  const post = await createTestPost(user.id);
  await request(app).delete(`/api/v1/posts/${post.id}`)
    .set('Cookie', getAuthCookie(user.id));
  const res = await request(app).get('/api/v1/feed')
    .set('Cookie', getAuthCookie(user.id));
  expect(res.body.data.items.find((p: any) => p.id === post.id)).toBeUndefined();
});
```

---

### GAP-H3: Feed cursor-based pagination correctness

**No test for:** second page returns next N items; cursor advances correctly; last page returns `hasMore: false` with no `nextCursor`.

**Add to:** `backend/src/__tests__/feed.test.ts`

```ts
it('should paginate feed with cursor and return correct hasMore flag', async () => {
  // create 25 posts, request limit=20, verify nextCursor present
  // then request with that cursor, verify remaining 5, hasMore false
  const firstPage = await request(app).get('/api/v1/feed?limit=20').set('Cookie', cookie);
  expect(firstPage.body.data.nextCursor).toBeTruthy();
  const secondPage = await request(app)
    .get(`/api/v1/feed?limit=20&cursor=${firstPage.body.data.nextCursor}`)
    .set('Cookie', cookie);
  expect(secondPage.body.data.nextCursor).toBeNull();
});
```

---

### GAP-H4: Unauthenticated access to private post returns 404

**Existing test** in `posts.test.ts` (line 79–86) covers this. PASS — no gap.

---

### GAP-H5: followers-only posts are visible to followers but not strangers

**No test for:** `privacy: 'followers'` posts appear in a follower's feed but NOT in a non-follower's feed or discover feed.

**Add to:** `backend/src/__tests__/feed.test.ts`

```ts
it('should exclude followers-only posts from non-follower feed', async () => {
  const author = await createTestUser();
  const stranger = await createTestUser();
  await createTestPost(author.id, { privacy: 'followers' });
  const res = await request(app).get('/api/v1/feed')
    .set('Cookie', getAuthCookie(stranger.id));
  const followerPosts = res.body.data.items.filter(
    (p: any) => p.userId === author.id && p.privacy === 'followers');
  expect(followerPosts).toHaveLength(0);
});
```

---

### GAP-H6: useAuthHydrated hook behavior

**No test for:** `useAuthHydrated` returns `false` initially then `true` after `onFinishHydration` fires; or `true` immediately if `hasHydrated()` returns true on mount.

**Add to:** `frontend/src/__tests__/stores/auth-store.test.ts`

```ts
it('should return false before hydration completes', () => {
  vi.mocked(useAuthStore.persist.hasHydrated).mockReturnValue(false);
  const { result } = renderHook(() => useAuthHydrated());
  expect(result.current).toBe(false);
});
it('should return true immediately when store is already hydrated', () => {
  vi.mocked(useAuthStore.persist.hasHydrated).mockReturnValue(true);
  const { result } = renderHook(() => useAuthHydrated());
  expect(result.current).toBe(true);
});
```

---

### GAP-H7: OpenFreeMap CSP header is present on all routes

**Fix applied in:** `5eb2d12`
**No test for:** the `Content-Security-Policy` response header includes `*.openfreemap.org` in both `img-src` and `connect-src`. A CSP regression would silently break map tiles.

**Add to:** `frontend/src/__tests__/csp.test.ts` (or a Next.js integration test)

```ts
it('should include openfreemap.org in img-src and connect-src CSP directives', () => {
  expect(cspDirectives).toMatch(/img-src.*openfreemap\.org/);
  expect(cspDirectives).toMatch(/connect-src.*openfreemap\.org/);
});
```

---

## MEDIUM gaps — untested edge cases

### GAP-M1: Widget data handling — loading state and fallback values

**Fix applied in:** `ee04e2c`
**No test for:** widgets rendering with `null`/`undefined` data show a loading skeleton, not a crash; fallback values (e.g., `0` country count) render without throwing.

**Add to:** `frontend/src/__tests__/components/widgets/stats-widget.test.tsx`

```tsx
it('should render loading skeleton when data is undefined', () => {
  render(<StatsCountriesWidget data={undefined} />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
it('should render 0 with fallback when count is null', () => {
  render(<StatsCountriesWidget data={{ count: null }} />);
  expect(screen.getByText('0')).toBeInTheDocument();
});
```

---

### GAP-M2: Token refresh queue drains correctly

No test for multiple concurrent 401s triggering only one refresh and then re-executing all queued requests. The `failedQueue` logic in `client.ts` is untested.

**Add to:** `frontend/src/__tests__/api/client.test.ts`

```ts
it('should queue concurrent requests during refresh and drain them after success', async () => {
  mockRefreshSuccess();
  const [r1, r2] = await Promise.all([
    apiClient.get('/endpoint1'),
    apiClient.get('/endpoint2'),
  ]);
  expect(refreshCallCount).toBe(1); // only one refresh, not two
  expect(r1.status).toBe(200);
  expect(r2.status).toBe(200);
});
```

---

### GAP-M3: Duplicate follow returns 409

**Existing test** in `follows.test.ts` line 32–42 covers this. PASS — no gap.

---

### GAP-M4: Auth store persist migration (version 0 → 1)

No test for the migration function in `auth-store.ts` that converts old persisted state format (version 0) to version 1. A migration bug would silently log users out on upgrade.

**Add to:** `frontend/src/__tests__/stores/auth-store.test.ts`

```ts
it('should migrate version 0 state by preserving the user field', () => {
  const oldState = { user: { id: '1', username: 'test' } };
  const migrated = authStoreMigrate(oldState, 0);
  expect((migrated as AuthState).user).toEqual(oldState.user);
});
```

---

### GAP-M5: E2E — redirect loop does not occur on sign-in page

No Playwright test verifies that navigating to `/sign-in` when unauthenticated does NOT produce a redirect loop (i.e., the page settles without infinite redirects).

**Add to:** `frontend/e2e/auth.spec.ts`

```ts
test('should not redirect-loop on /sign-in when unauthenticated', async ({ page }) => {
  let redirectCount = 0;
  page.on('response', (r) => { if (r.status() >= 300 && r.status() < 400) redirectCount++; });
  await page.goto('/sign-in');
  await page.waitForLoadState('networkidle');
  expect(redirectCount).toBeLessThan(3);
  expect(page.url()).toContain('/sign-in');
});
```

---

### GAP-M6: Profile map tab renders without crashing

**New file added:** `frontend/src/app/(app)/profile/[username]/profile-map-tab.tsx` (untracked in git)
No test exists for this component at all.

**Add to:** `frontend/src/__tests__/app/(app)/profile/profile-map-tab.test.tsx`

```tsx
it('should render map tab with post markers', async () => {
  render(<ProfileMapTab username="testuser" posts={mockPosts} />);
  await waitFor(() => expect(screen.getByRole('region', { name: /map/i })).toBeInTheDocument());
});
it('should render empty state when user has no posts with coordinates', () => {
  render(<ProfileMapTab username="testuser" posts={[]} />);
  expect(screen.getByText(/no locations/i)).toBeInTheDocument();
});
```

---

## Infrastructure gaps blocking all test execution

These must be resolved before any coverage numbers are meaningful:

1. **Backend DB not running** — `localhost:5434` (test Postgres) is down. Fix: `docker compose up -d db-test` or add a CI service. All 56 backend tests are unreachable until resolved.

2. **Frontend Vitest worker timeout** — All 8 frontend suites fail with `Timeout waiting for worker to respond`. Root cause is likely a Next.js `'use client'` directive, Sentry import (`withSentryConfig` in next.config.ts), or heavy ESM dependency imported at module scope that hangs the jsdom worker. Fix: audit `frontend/src/__tests__/setup.ts` imports and add `pool: 'vmThreads'` or `singleFork: true` to `vitest.config.ts` as a workaround until the root import is identified.
