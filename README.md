# Viraha

**"Keep your travels alive"**

Viraha is a travel memory platform — Letterboxd for travel. Document experiences with location-tagged posts, organize them into albums and journals, and discover authentic places through your network.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### 1. Start databases

```bash
docker compose up -d
```

This starts PostgreSQL (with PostGIS) on port 5433 and Redis on port 6379.

### 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Backend runs at `http://localhost:4000`. Health check: `GET /health`.

### 3. Frontend setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Architecture

```
Viraha/
├── backend/           # Express + Prisma API server
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── routes/        # Express routers
│   │   ├── validators/    # Zod schemas
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── lib/           # Prisma, Redis, storage, cache
│   │   └── utils/         # JWT, password, activity helpers
│   └── prisma/            # Schema & migrations
├── frontend/          # Next.js App Router
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── components/    # UI components
│   │   └── lib/           # API clients, hooks, stores, types
└── docker-compose.yml # PostgreSQL + Redis
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, Tailwind CSS, shadcn/ui |
| State | React Query (server), Zustand (client) |
| Maps | MapLibre GL |
| Backend | Express, TypeScript |
| Database | PostgreSQL + PostGIS |
| ORM | Prisma |
| Cache | Redis |
| Storage | Cloudflare R2 / local disk |
| Auth | JWT with refresh token rotation |
| Validation | Zod |

## Features

- **Posts** — Location-tagged photo memories with tags and privacy
- **Albums** — Curated collections of posts
- **Journals** — Narrative travel entries with markdown, mood, and photos
- **Map** — Interactive map as the primary canvas for browsing memories
- **Dual-Mode Feed** — Local (following-based) and Traveling (location-based)
- **Travel Mode** — Context-aware app behavior based on your location
- **Explore** — Discover trending destinations and content
- **Privacy** — Per-content privacy controls, private accounts

## API

All endpoints are prefixed with `/api/v1`. See `backend/src/routes/` for the full list.

Key route groups: `/auth`, `/posts`, `/albums`, `/journals`, `/users`, `/feed`, `/follows`, `/comments`, `/saves`, `/activities`, `/travel`, `/media`, `/places`, `/map`, `/explore`, `/reports`.

## Environment Variables

See `backend/.env.example` and `frontend/.env.local.example` for all configuration options.

## Testing

```bash
# Backend (requires Docker for test database)
docker compose up -d postgres-test redis
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

## License

MIT
