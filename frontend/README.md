# Viraha — Frontend

Next.js (App Router) web app. See the [root README](../README.md) for setup and
[docs/DESIGN.md](../docs/DESIGN.md) for the design language.

```bash
cp .env.local.example .env.local
npm install
npm run dev          # http://localhost:3000
npm test             # unit tests (Vitest)
npx playwright test  # end-to-end
npm run build        # production build (standalone output)
```

- `src/app/` — `(marketing)`, `(auth)` and `(app)` route groups
- `src/components/` — UI by feature; `cinema/` holds the shared primitives
- `src/lib/` — `api/` clients, `hooks/` (TanStack Query), `stores/` (Zustand), `design/` tokens
