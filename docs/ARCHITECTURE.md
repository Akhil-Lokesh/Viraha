# Viraha — Architecture

Two apps in one repo: an Express API (`backend/`) and a Next.js web app (`frontend/`),
backed by PostgreSQL + PostGIS and Redis.

```
Browser ──► Next.js (App Router, client-rendered product pages)
   │            │ axios, cookies + CSRF header
   │            ▼
   └──SSE──► Express API /api/v1 ──► Prisma ──► PostgreSQL + PostGIS
                 │   │
                 │   └─► Redis: response cache, rate limits, realtime pub/sub
                 └─────► R2 or local disk (media), Resend (email), Photon/Google (places)
```

## Backend

**Request path:** `routes/<resource>.ts` → middleware (`rateLimiter`, `authenticate`,
CSRF, `validate(zodSchema)`, `upload`) → `controllers/<resource>Controller.ts` → Prisma.
Every response uses one envelope: `{ success, data }` or `{ success: false, error: { code, message } }`,
produced by the controllers and `middleware/errorHandler.ts`.

**Config:** `src/config/env.ts` validates the environment with Zod at boot. In production the
server exits on missing or placeholder secrets.

**Auth:** short-lived access JWT and a rotating refresh token, both in httpOnly cookies
(`utils/cookies.ts`); refresh tokens are stored per session so users can see and revoke
sessions. Mutating requests need a CSRF double-submit token (`middleware/csrf.ts`; the
frontend fetches it once via `CsrfInitializer`). Google sign-in verifies ID tokens with
`google-auth-library`.

**Privacy:** every read path filters by post/album/journal privacy, follow status, blocks
(both directions) and mutes (`lib/blocks.ts`). Hidden locations are redacted server-side
(`utils/locationPrivacy.ts`): coordinates become null, city and country remain.

**Caching (`lib/cache.ts`):** best-effort Redis JSON cache. Shared caches (trending,
logged-out discover feed) are only used for viewers without blocks or mutes. Each user's
personal feed is cached briefly under a versioned key (`lib/feedCache.ts`); follow, mute and
block changes bump the version so the next request is fresh.

**Realtime (`lib/realtime.ts`):** `GET /activities/stream` is a Server-Sent Events stream.
Activities are published through Redis pub/sub so any API instance can deliver them;
without Redis, delivery is in-process.

**Media:** uploads go through `multer` (memory), are validated by magic bytes and
re-encoded to WebP with `sharp` (`lib/image.ts`), then stored in R2 or `backend/uploads`
(`lib/storage.ts`). Stored paths are relative when local; the frontend resolves them
against the API origin.

**Services:** `journeyDetector` groups posts into trips; `virahaEngine` computes "Viraha
moments" (places that miss you, on this day, seasonal reflections), recomputed by the
in-process scheduler in `jobs/` (enabled by default in production, `ENABLE_JOBS` to override);
`placeSearch` wraps Google Places or the keyless Photon geocoder.

**Data model:** `prisma/schema.prisma` is the source of truth — users and the social graph
(follows, blocks, mutes), content (posts, albums, journals and entries, scrapbooks,
time capsules, want-to-go), engagement (comments, reactions, saves, activities, reports),
sessions and tokens, and derived data (journeys, Viraha moments, place notes). Posts carry
both decimal lat/lng and a PostGIS `geography` column with GiST indexes for nearby queries.

## Frontend

**Routes (`src/app`):**
- `(marketing)` — the public landing page.
- `(auth)` — sign-in, sign-up, password reset, email verification.
- `(app)` — the product, behind `AuthGuard`, inside the sidebar / mobile-nav shell.

**Data:** `lib/api/<resource>.ts` are thin axios clients (`lib/api/client.ts` handles CSRF,
token refresh and auth redirects). `lib/hooks/use-<resource>.ts` wrap them in TanStack Query.
Mutations invalidate every query family their change affects (e.g. a new post refreshes
feed, map, atlas, explore and profile data).

**Client state:** Zustand stores in `lib/stores` — the signed-in user (only non-sensitive
fields persist to localStorage), dashboard widget layout, travel mode.

**UI:** MUI with a single dark theme (`lib/theme.ts`) and the Dark Cinematic primitives in
`components/cinema`. See [DESIGN.md](DESIGN.md).

**Security headers:** `next.config.ts` sets the CSP (API origin, R2, OpenFreeMap, Unsplash,
Sentry), HSTS and frame denial.

## Testing

- `backend/src/__tests__` — Vitest + Supertest integration tests against a real Postgres
  test database (tables truncated between tests; runs serially).
- `frontend/src/__tests__` — Vitest unit tests for API clients, hooks, stores and primitives.
- `frontend/e2e` — Playwright flows (auth, navigation, profile, journals).
