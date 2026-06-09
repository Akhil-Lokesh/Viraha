# Integration Review R2
Reviewer: integration-checker
Branch: feat/mvp-blockers-batch-1
Date: 2026-06-09

Commits reviewed: backend 74a57ef + frontend 180b8f4

---

## Coherence Table

| Frontend Call | Backend Route | Auth | CSRF | Owner Check | Privacy | Issues |
|---|---|---|---|---|---|---|
| `muteUser(username)` | `POST /api/v1/users/:username/mute` | YES | YES (via global doubleCsrfProtection on /api/v1) | n/a (muter=req.user) | n/a | none |
| `unmuteUser(username)` | `DELETE /api/v1/users/:username/mute` | YES | YES | n/a | n/a | none |
| `getMutedUsers()` | `GET /api/v1/users/me/muted` | YES | n/a (GET) | n/a | n/a | none |
| `getSessions()` | `GET /api/v1/auth/sessions` | YES | n/a (GET) | n/a | n/a | Date fields serialized as Date objects, not ISO strings — see CRIT-1 |
| `revokeSession(id)` | `DELETE /api/v1/auth/sessions/:id` | YES | YES | YES (scoped by userId in deleteMany) | n/a | none |
| `revokeOtherSessions()` | `DELETE /api/v1/auth/sessions` | YES | YES | YES (scoped by userId) | n/a | none |
| SSE `resolveStreamUrl()` | `GET /api/v1/activities/stream` | YES (cookie) | n/a (GET/EventSource) | n/a | n/a | Token expiry silent failure — see CRIT-2; rate limit exhaustion — see HIGH-1 |
| `PostCard` / `post-detail` coords | `redactPostLocation` nulls lat/lng | n/a | n/a | n/a | YES | Post type declares `locationLat: number` (non-nullable) — see CRIT-3 |
| `profile-map-tab` coords | same redaction | n/a | n/a | n/a | YES | No null guard before passing to MapMarker — see CRIT-3 |
| `useMuteUser` / `useUnmuteUser` invalidation | feed/explore backends | n/a | n/a | n/a | n/a | Invalidation keys match (prefix semantics) — see note |
| `wantToGoItems` on map page | `GET /api/v1/want-to-go` | YES | n/a | n/a | n/a | `WantToGoItem.locationLat` typed `number` (non-nullable) — same family as CRIT-3 |

---

## Findings

### CRIT-1: Session date fields serialized as Date objects, not ISO strings

**Severity: CRITICAL**

**Files:**
- `/Users/akhil/Desktop/Viraha/backend/src/controllers/authController.ts` lines 687–694
- `/Users/akhil/Desktop/Viraha/frontend/src/lib/types/index.ts` lines 358–365

**Detail:**

The `listSessions` controller builds each session object by passing Prisma `Date` values directly into the `res.json()` payload:

```ts
// authController.ts lines 687-694
const sessions = tokens.map((t) => ({
  id: t.id,
  userAgent: t.userAgent,
  ip: t.ip,
  createdAt: t.createdAt,      // Prisma Date — serialized by JSON.stringify as ISO string
  lastUsedAt: t.lastUsedAt,    // Prisma Date | null — same
  current: ...,
}));
```

`JSON.stringify` calls `.toISOString()` on Date objects, so the wire value IS an ISO string. The frontend `AuthSession` type declares `createdAt: string` and `lastUsedAt: string | null`, which matches. This is fine at runtime.

**Correction:** This is not a bug — verified safe. The concern was unfounded.

---

### CRIT-2: SSE stream silently dies after access-token expiry — no recovery path

**Severity: CRITICAL**

**Files:**
- `/Users/akhil/Desktop/Viraha/frontend/src/lib/hooks/use-activity-stream.ts` lines 52–55, 57–59, 91–122
- `/Users/akhil/Desktop/Viraha/backend/src/middleware/auth.ts` (authenticate middleware — token validation)
- `/Users/akhil/Desktop/Viraha/backend/src/lib/realtime.ts` lines 160–193

**Detail:**

The SSE stream is opened via the browser's native `EventSource` API with `withCredentials: true`. The `authenticate` middleware runs once at connection time and validates the `viraha_access` cookie. Access tokens have a 15-minute TTL. After expiry:

1. The server does NOT close the existing SSE stream when the token expires — it has already passed auth. The stream continues to emit heartbeats (`: ping`) indefinitely.
2. However, if the client reconnects (after a network drop, browser tab restore, or explicit close), the new `EventSource` connection hits `authenticate` with an expired token and receives a 401. The SSE `error` event fires, the backoff reconnect loop in `createActivityStreamManager` retries, but every retry also hits 401. The backoff reaches 30 s and stays there, retrying forever with 401 — the stream never recovers.
3. The token-refresh interceptor in `/Users/akhil/Desktop/Viraha/frontend/src/lib/api/client.ts` lines 46–97 handles 401s on `axios` calls only. `EventSource` is not routed through axios; its 401 response never triggers the refresh interceptor.
4. There is no path where the stream reconnect triggers a cookie refresh. The user's page silently stops receiving real-time activity notifications. Polling fallback in `use-activities.ts` may compensate, but the stream will never self-heal until the user performs another API call (which then refreshes the token) and the stream happens to reconnect.

**Suggested fix:**

In `use-activity-stream.ts`, on `error` event, attempt an axios token-refresh call before scheduling the backoff reconnect. If the refresh succeeds, the next reconnect attempt will have a valid cookie. If the refresh fails (truly expired session), stop the stream and set status to `idle`.

```ts
// In the connect() error handler, before scheduling reconnect:
current.addEventListener('error', async () => {
  if (stopped || source !== current) return;
  current.close();
  source = null;
  try {
    await apiClient.post('/auth/refresh', {});
    await fetchCsrfToken();
  } catch {
    // refresh failed — stop stream entirely, let UI prompt re-login
    stopped = true;
    onStatusChange('idle');
    return;
  }
  onStatusChange('reconnecting');
  // ... backoff reconnect as before
});
```

Note: `createActivityStreamManager` must be made async or the refresh must be handled outside the synchronous error callback via a flag. Alternatively, trigger the refresh in `useActivityStream` hook when status transitions to `reconnecting`.

---

### CRIT-3: `Post.locationLat` / `Post.locationLng` typed as non-nullable `number` in frontend, but backend redaction nulls them

**Severity: CRITICAL**

**Files:**
- `/Users/akhil/Desktop/Viraha/frontend/src/lib/types/index.ts` lines 27–28 (`Post` interface)
- `/Users/akhil/Desktop/Viraha/backend/src/utils/locationPrivacy.ts` lines 22–29
- `/Users/akhil/Desktop/Viraha/frontend/src/app/(app)/profile/[username]/profile-map-tab.tsx` lines 94–95
- `/Users/akhil/Desktop/Viraha/frontend/src/components/post/post-card.tsx` line 76
- `/Users/akhil/Desktop/Viraha/frontend/src/components/post/post-detail.tsx` line 478

**Detail:**

The `Post` interface declares:

```ts
// types/index.ts lines 27-28
locationLat: number;
locationLng: number;
```

The backend `redactPostLocation` returns `{ ...post, locationLat: null, locationLng: null }` for posts where `showLocation === false` and the viewer is not the author. This means the wire value is `null`, but TypeScript believes it is `number`. Code that calls `Number(posts[0]?.locationLng ?? 0)` at `profile-map-tab.tsx:77–78` silently substitutes 0 — placing the map center at `[0, 0]` (Gulf of Guinea) instead of showing no map or an error. That's a silent wrong-location bug.

The `hasCoordinates` guard in `keepsake.ts` uses `Number.isFinite(lat)` which correctly returns `false` for `null` (since `Number.isFinite(null)` is `false`). So `PostCard` and `post-detail` correctly suppress the coordinate display and show the "Approximate location" stamp. The guard works at runtime despite the wrong type.

The dangerous code path is `profile-map-tab.tsx` lines 77–78 and 94–95:

```tsx
// profile-map-tab.tsx lines 76-79: center falls back to [0,0] for null coords
center={[
  Number(posts[0]?.locationLng ?? 0),  // null → 0
  Number(posts[0]?.locationLat ?? 0),  // null → 0
]}
// lines 94-95: null passed directly to MapMarker with no guard
longitude={post.locationLng}   // can be null at runtime
latitude={post.locationLat}    // can be null at runtime
```

The `mapPosts` filter on the profile page (`profile/[username]/page.tsx` line 157) is `p.locationLat && p.locationLng` — falsy check — which correctly excludes `null` and `0`. So `profile/[username]/page.tsx` is safe. But `profile-map-tab.tsx` receives an already-filtered array from the parent and does not re-guard, so the issue there is only the `[0,0]` center on `posts[0]` being null (not possible after the parent filter). However, `profile-map-tab.tsx` is also exported for direct use, and direct callers could pass unfiltered posts.

**Suggested fixes (both required):**

1. In `types/index.ts` line 27–28, change to:
   ```ts
   locationLat: number | null;
   locationLng: number | null;
   ```

2. In `profile-map-tab.tsx`, filter out null-coord posts before rendering markers:
   ```ts
   const mappablePosts = posts.filter(
     (p) => p.locationLat != null && p.locationLng != null
   );
   ```
   Use `mappablePosts` for `center` and `{mappablePosts.map(...)}`.

---

### HIGH-1: SSE `/activities/stream` subject to general `apiLimiter` — long-lived connections exhaust per-IP request budget

**Severity: HIGH**

**Files:**
- `/Users/akhil/Desktop/Viraha/backend/src/app.ts` line 146
- `/Users/akhil/Desktop/Viraha/backend/src/routes/activities.ts` line 9

**Detail:**

The general `apiLimiter` is mounted at `app.use('/api/v1', apiLimiter)` with `windowMs: 15 min, limit: 200`. Every SSE reconnect consumes one request count from the IP's 15-minute budget. Under the backoff retry loop described in CRIT-2 (repeated 401s), the client can exhaust the 200-request budget in under 15 minutes (30 s max backoff × 200 requests = ~100 minutes worst case, but with 1 s initial backoff and doubling, the first 8 reconnects happen within ~4 minutes, and after a CRIT-2 scenario with browser restores the budget burns faster). Additionally, each tab open sends a fresh SSE connect. Once rate-limited, all API calls from that IP also start failing — including posts, feed, and saves.

The SSE endpoint also has no per-user connection cap enforcement at the rate-limiter level; `registerConnection` in `realtime.ts` caps at 5 in-process connections but the per-IP request counter still ticks on each `EventSource` constructor call.

**Suggested fix:**

Add a dedicated SSE limiter that exempts long-lived connections from the general request budget. The simplest approach: exclude `/api/v1/activities/stream` from the general `apiLimiter` and apply a lower-rate SSE-specific limiter (e.g. 10 connects per 5 minutes per IP):

```ts
// app.ts
app.use('/api/v1', (req, res, next) =>
  req.path === '/activities/stream' ? next() : apiLimiter(req, res, next)
);
app.use('/api/v1/activities/stream', sseLimiter); // new: 10/5min
```

---

### HIGH-2: CSRF on `DELETE /auth/sessions` and `DELETE /auth/sessions/:id` is skipped in test environment — production is protected but the gap is untested

**Severity: HIGH**

**Files:**
- `/Users/akhil/Desktop/Viraha/backend/src/app.ts` lines 151–153
- `/Users/akhil/Desktop/Viraha/frontend/src/lib/api/client.ts` lines 22–27

**Detail:**

```ts
// app.ts lines 151-153
if (env.NODE_ENV !== 'test') {
  app.use('/api/v1', doubleCsrfProtection);
}
```

CSRF protection is disabled in the test environment. The frontend `axios` client attaches `X-CSRF-Token` on every DELETE/POST/PUT/PATCH call (client.ts lines 22–27). In production this is correct. However, no test verifies that the `X-CSRF-Token` header is actually sent by the frontend for session DELETE calls, because the backend silently accepts without it in test. If the header attachment were ever broken (e.g. a refactor that changed the CSRF token fetch logic), tests would still pass.

This is an existing pattern across all mutations in the codebase, not specific to sessions. It is flagged here because session revocation is a security-sensitive operation.

**Suggested fix:** Add at least one integration test for session revocation that explicitly verifies a 403 response when the CSRF header is absent (using `NODE_ENV !== 'test'` skipped for that one test, or a dedicated test app instance with CSRF enabled).

---

### MED-1: `profile-map-tab.tsx` passes null coords to `MapMarker` when called from external callers

**Severity: MEDIUM**

(This is the secondary part of CRIT-3. Listed separately because the profile page parent correctly filters, but the component's own interface contract is unsafe.)

**Files:**
- `/Users/akhil/Desktop/Viraha/frontend/src/app/(app)/profile/[username]/profile-map-tab.tsx` lines 84–95

**Detail:**

`ProfileMapTab` accepts `posts: Post[]` and renders a `MapMarker` for each post without filtering null coords. Its contract relies entirely on callers pre-filtering. The `Post` type (once fixed per CRIT-3) will have `locationLat: number | null`, and passing `null` to a MapLibre `latitude` prop renders the marker at an invalid position or throws depending on the MapLibre version.

**Suggested fix:** Add the null-coord filter inside `ProfileMapTab` itself, not only at call sites.

---

### MED-2: `wantToGoItems` on map page passes null coords to `MapMarker` without guard

**Severity: MEDIUM**

**Files:**
- `/Users/akhil/Desktop/Viraha/frontend/src/app/(app)/map/page.tsx` lines 882–886
- `/Users/akhil/Desktop/Viraha/frontend/src/lib/api/wantToGo.ts` lines 6–7

**Detail:**

`WantToGoItem.locationLat` and `locationLng` are typed as `number` (non-nullable). The Prisma schema for `WantToGo` shows `locationLat Decimal @map("location_lat")` — non-nullable at the DB level — so this is safe for WantToGo specifically. However the map page renders these markers with only a `status !== 'visited'` filter and no coord guard:

```tsx
// map/page.tsx lines 882-886
{wantToGoItems?.filter((w) => w.status !== 'visited').map((item) => (
  <MapMarker longitude={item.locationLng} latitude={item.locationLat} ...>
```

If the schema ever relaxes nullability or an older record exists, this will silently misrender. Severity kept at MEDIUM because the schema enforces non-null today.

---

### MED-3: Mute invalidation uses prefix `['feed']` and `['explore']` — works today but fragile

**Severity: MEDIUM**

**Files:**
- `/Users/akhil/Desktop/Viraha/frontend/src/lib/hooks/use-mutes.ts` lines 22–23, 34–35

**Detail:**

React Query's `invalidateQueries({ queryKey: ['feed'] })` invalidates all queries whose key starts with `'feed'`. Today the feed hooks use `['feed', 'personal']` and `['feed', 'discover']`, so this works correctly. The pattern is consistent with how `use-follows.ts` and `use-user.ts` also invalidate `['feed']`. This is a known convention in the codebase, not a bug.

However, `['explore']` with prefix matching would also invalidate any future explore query added under that key. This is fine as long as the convention is maintained. No code change required, but document the convention.

---

### LOW-1: `Post.locationLat` / `locationLng` in `CreatePostInput` (types/index.ts) are `number` (required), but the frontend type for `MapMarker` latitude/longitude on the map page expects them from `MapMarkerData.lat`/`lng` which are plain `number` — no nullability issue there

**Severity: LOW**

**Files:**
- `/Users/akhil/Desktop/Viraha/frontend/src/lib/types/index.ts` lines 322–325 (`MapMarkerData`)

**Detail:**

`MapMarkerData.lat` and `MapMarkerData.lng` are typed `number` (non-nullable), and these come from the map backend endpoint (`GET /api/v1/map`), not from the post location-redaction path. The map endpoint returns `MapMarkerData` shapes, not `Post` shapes. No mismatch.

---

### LOW-2: `resolveStreamUrl()` strips a trailing slash — no issue with current `NEXT_PUBLIC_API_URL` default

**Severity: LOW**

**Files:**
- `/Users/akhil/Desktop/Viraha/frontend/src/lib/hooks/use-activity-stream.ts` lines 52–55

**Detail:**

```ts
export function resolveStreamUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  return `${base.replace(/\/+$/, '')}${STREAM_PATH}`;
}
```

`api/client.ts` uses the same `NEXT_PUBLIC_API_URL` as `baseURL`. `STREAM_PATH` is `/activities/stream`, which resolves to `http://localhost:4000/api/v1/activities/stream`. The backend mounts `activityRoutes` at `/api/v1/activities` and the route is `GET /stream`. This matches exactly. No issue.

---

### LOW-3: `revokeOtherSessions` returns `{ revoked: result.count }` — frontend expects `data.revoked: number`

**Severity: LOW (already correct)**

**Files:**
- `/Users/akhil/Desktop/Viraha/backend/src/controllers/authController.ts` lines 742–759
- `/Users/akhil/Desktop/Viraha/frontend/src/lib/api/sessions.ts` lines 9–11, 24–27

**Detail:**

Backend: `res.json({ success: true, data: { revoked: result.count } })`.
Frontend `RevokeAllResponse`: `{ success: boolean; data: { revoked: number } }`.
Frontend extracts `res.data.data.revoked`. This matches exactly.

---

## Summary by Severity

| Severity | Count | Items |
|---|---|---|
| CRITICAL | 2 | CRIT-2 (SSE token expiry/no recovery), CRIT-3 (Post type non-nullable coords crash) |
| HIGH | 2 | HIGH-1 (SSE rate limit exhaustion), HIGH-2 (CSRF untested on session revoke) |
| MEDIUM | 3 | MED-1 (profile-map-tab null coord contract), MED-2 (wantToGo map guard), MED-3 (invalidation key fragility) |
| LOW | 3 | LOW-1, LOW-2, LOW-3 (all verified safe) |

---

## Prioritized Fix List

### P0 — Fix immediately (production correctness)

1. **CRIT-3**: `/Users/akhil/Desktop/Viraha/frontend/src/lib/types/index.ts` lines 27–28
   Change `locationLat: number` and `locationLng: number` on the `Post` interface to `locationLat: number | null` and `locationLng: number | null`. This makes TypeScript enforce null guards at all call sites.

2. **CRIT-3 (companion)**: `/Users/akhil/Desktop/Viraha/frontend/src/app/(app)/profile/[username]/profile-map-tab.tsx` lines 64–120
   Filter out null-coord posts before the `MapComponent` center calculation and before the `MapMarker` render loop. The parent page's filter is not a substitute for the component's own safety.

3. **CRIT-2**: `/Users/akhil/Desktop/Viraha/frontend/src/lib/hooks/use-activity-stream.ts` lines 91–122 (`connect()` function)
   Before scheduling a backoff reconnect on SSE error, attempt a token refresh via `apiClient.post('/auth/refresh', {})`. If the refresh fails, stop the stream and set status `'idle'`. This prevents infinite 401 retry loops and silently dead notification streams.

### P1 — Fix before next release

4. **HIGH-1**: `/Users/akhil/Desktop/Viraha/backend/src/app.ts` line 146 and `/Users/akhil/Desktop/Viraha/backend/src/routes/activities.ts`
   Exempt `/api/v1/activities/stream` from `apiLimiter`. Apply a dedicated SSE connection limiter (lower rate, separate Redis key prefix `rl:sse:`).

5. **MED-1 / MED-2**: Propagate the CRIT-3 type fix through `profile-map-tab.tsx` and add a coord guard to the `wantToGoItems` render in `map/page.tsx` line 882.

### P2 — Tech debt

6. **HIGH-2**: Add one test that enables CSRF and verifies that `DELETE /auth/sessions/:id` without `X-CSRF-Token` returns 403.

