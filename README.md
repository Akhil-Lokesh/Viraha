# Viraha

**विरह — the ache of separation from what you love.**

Viraha is a travel memory platform — Letterboxd for travel. Every memory is pinned to a
place: post photos with a story, gather them into albums, write journals, and relive it all
on a map. Discovery happens through people you trust, not star ratings.

- [Product](docs/PRODUCT.md) — what Viraha is for and what it does
- [Design](docs/DESIGN.md) — the Dark Cinematic design language and UI primitives
- [Architecture](docs/ARCHITECTURE.md) — how the backend and frontend fit together

---

## Quick start

Requires Node.js 20+, npm and Docker.

```bash
docker compose up -d            # Postgres + PostGIS (5433), test DB (5434), Redis (6379)
```

```bash
cd backend
cp .env.example .env            # then set the three secrets (openssl rand -hex 32)
npm install
npx prisma migrate dev          # create the schema
npm run db:seed                 # demo travelers, posts, albums and journals
npm run dev                     # API on http://localhost:4000
```

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                     # app on http://localhost:3000
```

Sign in as any seeded traveler — e.g. `anya@viraha.com` / `password123` — or
`demo@viraha.com` for an empty account that shows the first-run experience.

## Stack

| Layer    | Technology |
|----------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, MUI 7 + Emotion, Framer Motion |
| Data     | TanStack Query (server state), Zustand (client state) |
| Maps     | MapLibre GL with the OpenFreeMap dark basemap (no key) |
| Backend  | Express 5, TypeScript, Zod validation |
| Database | PostgreSQL + PostGIS via Prisma |
| Cache / realtime | Redis — response caching, pub/sub for Server-Sent Events |
| Media    | Cloudflare R2 (or local disk), `sharp` for resizing |
| Auth     | JWT in httpOnly cookies with refresh rotation, CSRF double-submit, Google sign-in |
| Ops      | Pino logging, Sentry, Docker, GitHub Actions |

## Layout

```
backend/
  prisma/            schema, migrations, demo seed
  src/routes/        one router per resource, mounted under /api/v1
  src/controllers/   request handlers
  src/services/      domain logic (journey detection, Viraha moments, place search)
  src/lib/           prisma, redis, cache, storage, realtime, email
  src/middleware/    auth, CSRF, rate limits, validation, uploads
frontend/
  src/app/           routes: (marketing) landing, (auth) sign-in flows, (app) the product
  src/components/    UI by feature; cinema/ holds the shared design primitives
  src/lib/           api/ clients, hooks/ (TanStack Query), stores/, design/ tokens
```

## Configuration

Everything optional degrades gracefully when unset:

| Variable | Without it |
|----------|-----------|
| `REDIS_URL` | No caching; realtime delivers in-process (single instance only) |
| `R2_*` | Uploads are stored on local disk under `backend/uploads` |
| `GOOGLE_PLACES_API_KEY` | Location search uses OpenStreetMap (Photon) |
| `RESEND_API_KEY` | Verification and password-reset emails are not sent (dev logs the link) |
| `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | "Sign in with Google" is hidden |
| `SENTRY_DSN` | No error reporting |

See `backend/.env.example`, `frontend/.env.local.example`, and the root `.env.example`
(used by `docker-compose.prod.yml`).

## Testing

```bash
cd backend && npm test          # integration tests; needs the test DB from docker compose
cd frontend && npm test         # unit tests
cd frontend && npx playwright test   # end-to-end; starts both dev servers if they aren't running
```

CI (`.github/workflows/ci.yml`) type-checks both apps, runs both test suites, the
Playwright suite, production builds and a dependency audit.

## Deployment

- `docker-compose.prod.yml` runs Postgres, Redis, the API and the web app from the two Dockerfiles.
- `railway.toml` deploys the API container (runs `prisma migrate deploy` on start).
- The backend refuses to boot in production with missing or placeholder secrets.

## License

MIT
