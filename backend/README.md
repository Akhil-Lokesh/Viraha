# Viraha — Backend

Express 5 + Prisma API served under `/api/v1`. See the [root README](../README.md) for
setup and [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for how it fits together.

```bash
cp .env.example .env
npm install
npx prisma migrate dev   # apply migrations
npm run db:seed          # demo content
npm run dev              # http://localhost:4000 (health: GET /health)
npm test                 # integration tests (needs the test database)
npm run build && npm start
```

- `src/routes/` → `src/controllers/` → Prisma; `src/middleware/` for auth, CSRF, limits, validation
- `src/services/` — journey detection, Viraha moments, place search
- `src/lib/` — prisma, redis, cache, storage, realtime, email
- `prisma/` — schema, migrations, seed
