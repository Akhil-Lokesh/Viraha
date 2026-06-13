# Viraha

**"Keep your travels alive"**

Viraha is a travel memory platform — Letterboxd for travel. Document experiences as
location-tagged posts, weave them into albums and journals, browse them on an interactive
map, and discover authentic places through the people you follow. The interface is built
around a **Dark Cinematic** aesthetic that puts your photography first.

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm

### 1. Start databases

```bash
docker compose up -d
```

Brings up PostgreSQL + PostGIS on port **5433** (dev) and **5434** (test), and Redis on **6379**.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev      # apply schema
npm run db:seed             # optional: seed sample travel content
npm run dev
```

API runs at `http://localhost:4000` (prefix `/api/v1`). Health check: `GET /health`.

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React 19, TypeScript |
| UI | MUI (`@mui/material`) + Emotion, Framer Motion |
| Maps | MapLibre GL |
| State | TanStack Query (server state), Zustand (client state) |
| Backend | Express 5, TypeScript |
| Database | PostgreSQL + PostGIS |
| ORM | Prisma |
| Cache / realtime | Redis (ioredis), Server-Sent Events |
| Storage | Cloudflare R2 (S3 SDK) / local disk, `sharp` image processing |
| Auth | JWT with refresh-token rotation + Google OAuth |
| Security | Helmet, CSRF (`csrf-csrf`), Redis-backed rate limiting, Zod validation |
| Observability | Pino logging, Sentry |
| Testing | Vitest (+ coverage) |

---

## Architecture

```
Viraha/
├── backend/                # Express + Prisma API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # Express routers
│   │   ├── validators/      # Zod schemas
│   │   ├── middleware/      # Auth, CSRF, validation, rate limiting
│   │   ├── jobs/            # Background jobs / scheduler
│   │   ├── lib/             # Prisma, Redis, storage, cache
│   │   └── utils/           # JWT, password, activity helpers
│   └── prisma/              # Schema, migrations, seed
├── frontend/               # Next.js App Router
│   ├── src/
│   │   ├── app/             # Routes (App Router)
│   │   ├── components/      # UI components (incl. cinema primitives)
│   │   └── lib/             # API clients, hooks, stores, design tokens
└── docker-compose.yml      # PostgreSQL + PostGIS + Redis
```

---

## Features

- **Posts** — Location-tagged photo memories with tags and per-item privacy
- **Albums** — Curated collections of posts
- **Journals** — Narrative entries with markdown, mood, and photos
- **Map** — Interactive map as the primary canvas for browsing memories
- **Dual-Mode Feed** — Local (following-based) and Traveling (location-based)
- **Travel Mode** — Context-aware behavior based on where you are
- **Explore** — Trending destinations and content discovery
- **Realtime** — Server-Sent Events for live notifications and activity
- **Auth** — Email/password and Google OAuth, with refresh-token rotation and session management
- **Privacy** — Per-content controls, private accounts, mutes, location-privacy surfaces

---

## API

All endpoints are prefixed with `/api/v1`. See `backend/src/routes/` for the full list.

Key route groups: `/auth`, `/posts`, `/albums`, `/journals`, `/users`, `/feed`, `/follows`,
`/comments`, `/saves`, `/activities`, `/travel`, `/media`, `/places`, `/map`, `/explore`, `/reports`.

---

## Environment Variables

See `backend/.env.example` and `frontend/.env.local.example` for all configuration options.

---

## Testing

```bash
# Backend (requires the test database)
docker compose up -d postgres-test redis
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

---

## License

MIT
