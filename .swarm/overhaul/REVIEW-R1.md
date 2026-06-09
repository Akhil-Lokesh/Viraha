# Adversarial Review R1 — commit 74a57ef
**Reviewer:** code-reviewer agent  
**Scope:** realtime SSE, mutes, sessions, location privacy, background jobs

---

## Area 1: SSE Realtime

### (a) Does it achieve its goal?
Mostly yes. Auth is correctly delegated to the `authenticate` middleware before `sseHandler`, heartbeats work, graceful shutdown closes connections. Redis pub/sub fan-out and in-process fallback are structurally sound.

### (b) What adjacent case did it break?

**[CRITICAL] backend/src/lib/realtime.ts:147 — Double-delivery when Redis is available but subscriber hasn't confirmed subscription yet**

The fallback condition is `!published || !subscriberReady`. During the window between `redis.publish()` succeeding and the `subscriber.subscribe()` promise resolving (a race on the first few publishes after boot or after a reconnect attempt), `published=true` and `subscriberReady=false`. The fallback `deliverLocal()` fires immediately. Milliseconds later the Redis channel message arrives at the subscriber and `handleSubscriberMessage` → `deliverLocal()` fires again. The client receives the same activity notification twice with no dedup. Fix: set a `subscriberPending` flag while the subscribe promise is in-flight; treat pending as ready (don't fall back to local) when Redis publish succeeded.

```
Suggested fix: track subscriberPending=true between ensureSubscriber() call and subscribe() resolution;
change condition to: if (!published || (!subscriberReady && !subscriberPending))
```

**[HIGH] backend/src/lib/realtime.ts:97 — Redis subscriber never reconnects after a drop**

`subscriberInitialized` is set to `true` on the first call and never reset on the `'end'` event. After a Redis disconnect, `subscriberReady=false` and `ensureSubscriber()` becomes a permanent no-op (the guard at line 97 short-circuits). The subscriber is dead for the rest of the process lifetime. In a multi-instance deployment this means cross-instance delivery is silently broken until process restart. Fix: reset `subscriberInitialized = false` inside the `'end'` event handler so `ensureSubscriber()` re-initialises on the next SSE connection.

**[MEDIUM] backend/src/server.ts:33-38 — `shutdownRealtime()` runs before `server.close()`, creating a race**

`shutdownRealtime()` calls `res.end()` on every open SSE connection. `server.close()` then waits for connections to drain. But `res.end()` on a keep-alive SSE connection does not guarantee the underlying TCP socket is closed before `server.close()`'s callback fires — Node's `http.Server` counts live sockets, not finished responses. If a client doesn't acknowledge the FIN quickly, `server.close()` callback may fire while the socket is still open. The 10-second failsafe covers this, but the behaviour is non-deterministic. Fix: call `server.closeAllConnections()` (Node 18.2+) inside `server.close()` callback on timeout, or destroy sockets explicitly in `shutdownRealtime()`.

### (c) What assumption did the author make that isn't true?

The author assumes `subscriberReady` is a reliable synchronisation point between the publish path and the subscriber path. It is not: the flag transitions `false → true` asynchronously via a Promise resolution, and the publish path checks it synchronously, producing the window described above.

---

## Area 2: Mutes

### (a) Does it achieve its goal?
Yes. Mute/unmute/list endpoints work correctly. Filtering is applied to feed, discover, explore trending, activity stream, unread count, and featured content. Cache is invalidated on change.

### (b) What adjacent case did it break?

**[HIGH] backend/src/controllers/postController.ts:234 — `searchPosts` does not apply mute filtering**

`getPersonalizedFeed` and `getActivities` both call `getMutedUserIds` and suppress muted content. `searchPosts` only calls `getHiddenUserIds` (blocks). A muted user's public posts surface in search results for the muting user, inconsistent with the stated "invisible in feed/explore/activity" contract. Fix: add `getMutedUserIds` call in `searchPosts` alongside `getHiddenUserIds` and extend `userId: { notIn: [...hiddenIds, ...mutedIds] }`.

**[MEDIUM] backend/src/controllers/exploreController.ts:199 — `getFeaturedContent` caches the raw pool without `showLocation` field, then calls `redactPostLocation` on deserialized cache data**

The pool is cached as `any[]` at line 191. When the cache is warm, `p.showLocation` may be `undefined` on the deserialized object if the cache was populated before `showLocation` was added to the Prisma select (or if serialisation strips boolean `true` fields inconsistently). `redactPostLocation` only redacts when `post.showLocation === false` (strict equality), so `undefined` is treated as "don't redact" — the intended safe default. This is not a bug today but is fragile: a cache hit after a schema change or a select that omits `showLocation` silently bypasses privacy. Fix: ensure the pool query explicitly selects `showLocation` (it currently relies on Prisma including all fields via `findMany` without explicit `select` — this is fine, but should be documented).

**[MEDIUM] backend/src/lib/blocks.ts:91 — Mute cache TTL is 60 seconds; a mute takes up to 60 s to take effect in feeds**

The same TTL applies to blocks and is intentional for performance, but the `getMutedUsers` list endpoint returns the real-time database state while the feed filter uses the cached state. A freshly muted user's posts can still appear in the feed for up to 60 seconds. This divergence is not documented in the endpoint response. Low severity but should be noted in API docs.

### (c) What assumption did the author make that isn't true?

The author assumed all content-listing surfaces were audited for mute filtering. `searchPosts` was missed — it only got block filtering from a prior wave.

---

## Area 3: Sessions

### (a) Does it achieve its goal?
IDOR is correctly prevented: `revokeSession` scopes the delete by `{ id, userId }`, so a user cannot revoke another user's session — the row simply won't be found and a 404 is returned. UUID validation short-circuits invalid inputs before touching Postgres.

### (b) What adjacent case did it break?

**[CRITICAL] backend/src/controllers/authController.ts:679 — `listSessions` serializes the raw refresh token into the API response**

`select` fetches `token: true` to enable current-session detection (line 693: `t.token === currentRefreshToken`). The `sessions` map correctly excludes `token` from the output object — BUT the field is fetched from the database and held in the `tokens` array. The serialized response object does NOT include `token` (correct). However, **the raw token IS present in the intermediate `tokens` array** in memory. More critically: if any logging middleware or Sentry breadcrumb captures `req`/`res` body snapshots at the controller level, the `tokens` array (with raw token values) would be logged. The select should not fetch `token` at all; instead, compare using a hash. Fix: store a HMAC of the refresh token cookie in the DB (or compare by `id` after looking up the current token's id from the cookie).

Actually verifying more carefully: the `sessions` response object map at line 687-694 does NOT spread `t` — it explicitly constructs `{ id, userAgent, ip, createdAt, lastUsedAt, current }`. The raw `token` field is NOT in the HTTP response body. This is correctly handled. Downgrading to HIGH: the risk is internal (logging/APM capture of the intermediate array), not an HTTP response leak.

**[HIGH] backend/src/controllers/authController.ts:742 — `revokeOtherSessions` silently revokes ALL sessions including the current one when the `viraha_refresh` cookie is absent**

When called from a client that is authenticated via Authorization header (bearer JWT) without a refresh cookie present — e.g. a mobile client or a server-side request — `currentRefreshToken` is `undefined`. The spread `...(undefined ? ... : {})` evaluates to `{}`, so the `deleteMany` where clause is `{ userId }` with no token exclusion, deleting every session including the caller's own. The caller is immediately logged out on next token refresh. Fix: return 400 if the cookie is absent, or require the client to pass its session ID explicitly in the request body.

**[MEDIUM] backend/src/controllers/authController.ts:277 — `lastUsedAt` is updated on every token rotation but migration sets `DEFAULT CURRENT_TIMESTAMP`**

The migration sets `last_used_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`. Existing rows created before this migration (register/login/googleSignIn) will have `lastUsedAt` equal to the migration timestamp, not their actual creation time. This is a cosmetic issue (the session list will show a slightly wrong "last used" time for sessions created before the migration) but could confuse users. Fix: document this in the migration or backfill with `createdAt` where `lastUsedAt = migration_timestamp`.

### (c) What assumption did the author make that isn't true?

The author assumed the `viraha_refresh` cookie is always present for authenticated users calling `DELETE /sessions`. It is not: the `authenticate` middleware accepts a bearer JWT and does not require the cookie to be present.

---

## Area 4: Location Privacy

### (a) Does it achieve its goal?
Partially. `redactPostLocation` is correctly applied to: personal feed, discover feed, post detail, post list, search, map markers (excluded at query level), explore featured. It is NOT applied to the nearby feed.

### (b) What adjacent case did it break?

**[CRITICAL] backend/src/controllers/travelController.ts:228-283 — Nearby feed (`GET /api/v1/travel/nearby`) leaks exact coordinates of `showLocation=false` posts to any authenticated user**

`baseWhere` (line 186-192) has no `showLocation` filter. The response at line 272-283 sends `page` directly, which is the full Prisma post array including `locationLat`, `locationLng`, and `showLocation`. Posts with `showLocation=false` pass the bounding-box filter (they have real coordinates) and are returned with those coordinates intact to any authenticated user. The map controller correctly excludes them (`{ OR: [{ showLocation: true }, { userId: viewerId }] }`), but the nearby feed does not. Fix: add `showLocation: true` to `baseWhere` (excluding private-location posts entirely from nearby, consistent with map behaviour), or apply `redactPostsLocation(page, req.user!.userId)` before sending.

**[HIGH] backend/src/controllers/mapController.ts:35 — Viewer-scoped cache key explodes the cache keyspace**

The cache key includes `viewerId` (line 35: `:${viewerId || 'anon'}`). For a map with `N` distinct bounding boxes × `M` distinct users, there are `N × M` cache entries. With 10k active users and 100 common viewport combinations, that is 1M Redis keys for map responses. Each key has a 60-second TTL, so churn is high. The keys are not prefixed with a namespace that allows bulk-eviction. Fix: separate the cache into a shared pool (anonymous, `showLocation=true` posts only) and a per-user overlay (just the owner's `showLocation=false` pins), rather than caching the full merged result per viewer.

**[HIGH] backend/src/controllers/placeStoriesController.ts:26-63 — `myPosts` and `friendPosts` queries use a coordinate bounding box as input but do not validate that `lat`/`lng` are real numbers**

`Number(req.query.lat)` returns `NaN` if the query param is absent or non-numeric. The `isNaN` guard at line 15 catches this — but `radius` (line 13) has no such guard: `Number(undefined)` is `NaN`, and `NaN` arithmetic produces `NaN` in the filter values, causing Prisma to send `NULL` comparisons to Postgres (or throw a type error). Fix: validate `radius` with `isNaN(radius)` and apply a max cap.

### (c) What assumption did the author make that isn't true?

The author audited `mapController` (which correctly excludes `showLocation=false` pins at the query level) but did not apply the same treatment to `travelController.getNearbyFeed`, which uses the same geographic filtering concept but is a separate code path.

---

## Area 5: Background Jobs

### (a) Does it achieve its goal?
Yes. The scheduler starts correctly on boot, the Redis lock prevents cross-instance double-runs, and `computeMomentsForUser` failures are isolated per-user. Timers are unref'd so they do not keep the process alive.

### (b) What adjacent case did it break?

**[HIGH] backend/src/jobs/scheduler.ts:88-101 — No in-process overlap guard; a single instance can run the same job concurrently if the job duration exceeds `intervalMs`**

`setInterval` fires unconditionally every `intervalMs`. `executeJob` is `async` and `void`-cast — it returns immediately without awaiting. If `runVirahaMomentsRecompute` takes longer than 1 hour (unlikely but possible at scale with many active users), the next tick fires while the previous is still running on the same Node.js instance. The Redis lock prevents cross-instance overlap but does NOT prevent same-instance overlap because the lock TTL is `0.9 × interval` — by the time the second tick fires, the lock has expired and is re-acquired by the same process. Fix: add a module-level `Set<string>` of currently-running job names; skip if already running.

**[MEDIUM] backend/src/jobs/scheduler.ts:54 — `jobsEnabled()` reads `process.env.ENABLE_JOBS` directly instead of the validated `env` config object**

This bypasses the startup validation in `src/config/env.ts` and the normalized `env` object. If `ENABLE_JOBS` is set to an unrecognized value (e.g. `"TRUE"` — note capital letters are handled, but `"enable"` or `"active"` are not), `parseEnvFlag` returns `undefined` and the function falls back to `NODE_ENV === 'production'`. The unrecognized value is silently ignored. Fix: add `ENABLE_JOBS` to `env.ts` schema with the same accepted values, or log a warning when `parseEnvFlag` returns `undefined` for a non-empty value.

**[MEDIUM] backend/src/jobs/virahaMomentsRecompute.ts:28 — `lastLoginAt` field used in query but may not exist on all User rows**

The query filters `lastLoginAt: { gte: activeSince }`. Users who registered but never logged in (email-verify flow) or users whose `lastLoginAt` was never backfilled will have `lastLoginAt = null` and are correctly excluded by the `gte` filter. However, users active before this field was added (if no migration backfilled it) will be silently skipped. This is a data correctness issue, not a code bug, but worth noting.

### (c) What assumption did the author make that isn't true?

The author assumed the Redis lock is sufficient to prevent overlap on a single instance. The lock prevents cross-instance overlap; within one instance the lock is always acquired by the same PID, so it does not block re-entry.

---

## Cross-cutting Checks

### console.log
None found in any of the 22 new/modified files. Clean.

### TypeScript `any`
- `backend/src/controllers/feedController.ts:102` — `cacheGet<{ items: any[]; nextCursor: string | null }>` uses `any[]` in the generic parameter.
- `backend/src/controllers/exploreController.ts:29,122` — `cacheGet<any>` for trending locations and tags.
- `backend/src/controllers/exploreController.ts:199,201` — `(p: any)` filter/map callbacks on pool items.
- All pre-existing from exploreController; the `getFeaturedContent` `any` usages were introduced in this commit.

**[MEDIUM] backend/src/controllers/exploreController.ts:199,201 — New `(p: any)` cast introduced by this commit**

The `pool` is typed `any[]` (from `cacheGet<any[]>`). The `.filter((p: any) =>` and `.map((p: any) =>` are introduced in this commit's `getFeaturedContent` rewrite. Fix: define a `FeaturedPost` interface matching the Prisma select shape and type the cache generic.

### Error envelope consistency
All new endpoints use `{ success: false, error: { code, message } }` — consistent with the rest of the codebase.

### Migration
`20260609224408_mutes_and_session_metadata/migration.sql` is clean: adds nullable `ip`, `user_agent`, `last_used_at` (with DEFAULT) to `refresh_tokens`; creates `mutes` table with correct indices and cascade foreign keys. No destructive changes. Applied cleanly.

---

## Finding Index

| ID | Severity | File:Line | Description |
|----|----------|-----------|-------------|
| R1-01 | CRITICAL | `src/lib/realtime.ts:147` | Double-delivery when Redis publish succeeds but subscriber not yet ready |
| R1-02 | CRITICAL | `src/controllers/travelController.ts:228` | Nearby feed leaks `locationLat`/`locationLng` of `showLocation=false` posts |
| R1-03 | CRITICAL | `src/controllers/authController.ts:742` | `revokeOtherSessions` deletes ALL sessions (including caller's) when cookie absent |
| R1-04 | HIGH | `src/lib/realtime.ts:97` | Redis subscriber never reconnects after a drop; cross-instance delivery permanently broken |
| R1-05 | HIGH | `src/controllers/authController.ts:679` | Raw refresh token fetched from DB into memory; risk of capture by logging/APM middleware |
| R1-06 | HIGH | `src/controllers/postController.ts:234` | `searchPosts` missing mute filtering; muted users' posts appear in search |
| R1-07 | HIGH | `src/controllers/mapController.ts:35` | Viewer-scoped cache key creates unbounded cache keyspace (N users × M viewports) |
| R1-08 | HIGH | `src/jobs/scheduler.ts:88` | No in-process overlap guard; same job can run concurrently on single instance |
| R1-09 | HIGH | `src/controllers/placeStoriesController.ts:13` | `radius` query param not validated for `NaN`; downstream arithmetic produces invalid DB filter |
| R1-10 | MEDIUM | `src/server.ts:33` | `shutdownRealtime()` before `server.close()` — TCP socket close race; non-deterministic drain |
| R1-11 | MEDIUM | `src/controllers/authController.ts:277` | Existing sessions show wrong `lastUsedAt` after migration (DEFAULT vs. actual creation time) |
| R1-12 | MEDIUM | `src/jobs/scheduler.ts:54` | `ENABLE_JOBS` read from raw `process.env`, bypassing validated config; unrecognized values silently ignored |
| R1-13 | MEDIUM | `src/controllers/exploreController.ts:199` | `(p: any)` cast introduced in `getFeaturedContent`; breaks type safety on pool filter/map |
| R1-14 | MEDIUM | `src/lib/blocks.ts:91` | 60-second mute cache TTL means freshly muted users still appear in feeds for up to 1 minute |

---

## Summary

**3 CRITICAL, 5 HIGH, 6 MEDIUM issues found.**

### Top 3 Findings

**#1 — CRITICAL: Nearby feed coordinate leak (`travelController.ts:228`)**  
`GET /api/v1/travel/nearby` returns full post objects including `locationLat`/`locationLng` for every post in the bounding box, with no `showLocation` filter and no call to `redactPostLocation`. Any authenticated user can extract exact coordinates of posts whose authors set `showLocation=false`. Every other surface (map, feed, explore, search) was correctly patched; this one was missed.

**#2 — CRITICAL: `revokeOtherSessions` self-logout when cookie absent (`authController.ts:742`)**  
When `viraha_refresh` cookie is missing (bearer-token-only client), the where clause degrades to `{ userId }` with no token exclusion, deleting all sessions including the caller's own. The `authenticate` middleware does not require the cookie, so this is reachable in normal usage. The caller is silently logged out of all devices.

**#3 — CRITICAL: SSE double-delivery race (`realtime.ts:147`)**  
During the ~few milliseconds between a successful `redis.publish()` and the `subscriber.subscribe()` Promise resolving, `publishActivity` falls back to `deliverLocal()` AND the Redis channel message arrives and triggers `deliverLocal()` a second time. Every notification sent during the subscriber warm-up window is delivered twice to all open SSE connections.
