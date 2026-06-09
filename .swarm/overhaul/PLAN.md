# Viraha Production Overhaul Plan (2026-06-09)

Baseline: feat/mvp-blockers-batch-1 @ e795ebb — backend 187/187, frontend 70/70, tsc + build green.
User mandate: keep menubar + core idea; overhaul UI, backend, privacy, social; make it real-time and production-ready.

Grep-verified gap list (discovery claims corrected):
- ✅ Follow-request UI exists (activity page) — NOT a gap
- ✅ Trending filters blocks — NOT a gap
- ✅ Email only in own-profile responses — NOT a gap
- ❌ No mutes anywhere
- ❌ No session management (RefreshToken had no metadata, no list/revoke endpoints)
- ❌ Post.showLocation exists but enforcement of coordinate hiding unverified
- ❌ No real-time (30s polling only), no Redis pub/sub usage
- ❌ No background jobs (moments/trending on-demand only)
- ❌ UI generic MUI (design brief: .swarm/overhaul/DESIGN-BRIEF.md)

## Wave 0 (done by orchestrator)
Schema: Mute model; RefreshToken +userAgent/ip/lastUsedAt. Migration `20260609224408_mutes_and_session_metadata`.

## Wave 1 — Backend (parallel, disjoint files)
- **B1 realtime**: src/lib/realtime.ts (SSE registry + Redis pub/sub w/ in-process fallback),
  GET /api/v1/activities/stream (cookie-JWT auth, heartbeat), publish hook in src/utils/activity.ts. Tests.
  Owns: lib/realtime.ts, utils/activity.ts, routes/activityRoutes (stream route), new test file.
- **B2 mutes**: muteController + routes, feed/explore filtering (muted hidden from feeds/trending,
  profile still visible), activity suppression from muted actors. Tests.
  Owns: controllers/muteController.ts, controllers/feedController.ts, controllers/exploreController.ts,
  controllers/activityController.ts, lib/blocks.ts (extend), route registration, new test file.
- **B3 sessions**: capture UA/IP at login+refresh, lastUsedAt on refresh; GET /auth/sessions,
  DELETE /auth/sessions/:id, DELETE /auth/sessions (revoke others). Tests.
  Owns: controllers/authController.ts, routes/auth, new test file.
- **B4 location-privacy**: verify+enforce Post.showLocation — when false, strip/round coords for
  non-owners in every post-serializing endpoint (feed, explore, post detail, map, profile posts). Tests.
  Owns: utils/postSerializer (new or existing serialization point), controllers/postController.ts,
  controllers/mapController.ts, new test file.
- **B5 jobs**: in-process scheduler (setInterval-based, env-gated ENABLE_JOBS) for viraha moments
  recompute + trending cache warm; wire into server.ts with graceful shutdown. Tests.
  Owns: src/jobs/*, server.ts.

## Wave 2 — Frontend (parallel, disjoint pages; all UI agents follow DESIGN-BRIEF.md)
- **F1 realtime+activity**: useActivityStream EventSource hook (reconnect/backoff, query invalidation,
  poll fallback) + activity page redesign (day groups, flight-path, unread gold dots).
- **F2 privacy**: settings redesign per brief + new Privacy additions: muted-users list, sessions list
  w/ revoke, location-precision visibility; profile-menu Mute/Unmute; mute hooks/api client.
- **F3 home**: dashboard → journal opening spread.
- **F4 explore+postcard**: feed + PostCard flagship redesign (+ "approximate location" stamp when hidden).
- **F5 profile**: passport-spread profile.
- **F6 shelves**: albums + journals + atlas.
- **F7 first-impression**: auth pages + empty states + global theme tokens (paper surfaces, shadows).
  F7 owns theme files; other agents consume tokens via sx (no theme edits outside F7).

## Wave 3 — Review (3 adversarial reviewers over the wave diffs) → Wave 3.5 targeted fixes.

## Wave 4 — Verify: tsc both, backend+frontend suites, next build, live smoke (backend :4000, frontend :3001,
SSE event observed end-to-end), commit(s), memory update.
