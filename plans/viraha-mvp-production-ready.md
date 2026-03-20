# Blueprint: Viraha — Documentation to Production-Ready MVP

**Objective**: Build out the Viraha travel memory platform from its current ~75% implementation state to a production-ready MVP that can be deployed, tested, and opened to beta users. This plan covers Phase 2 completion (Rich Content & Map) only — Phase 3 features (Scrapbook, advanced discovery) are explicitly deferred.

**Current State**: Phase 1 (Core Foundation) is complete. Most frontend pages exist (23 pages), backend API is functional, map/dashboard/feed are implemented. Critical gaps: zero test coverage, no CI that runs tests, incomplete schema fields, coordinates stored as Decimal instead of PostGIS, no deployment pipeline, missing E2E flows.

**Default Branch**: `main`
**Git + GitHub CLI**: Available (authenticated as AkhillHomie)

---

## Dependency Graph

```
Step 0 (Infra Foundation) ──┬──> Step 1 (Schema)
                             │
                             └──> Step 7 (Docker & Deploy)

Step 1 (Schema) ──> Step 2 (Backend Gaps)

Step 2 (Backend Gaps) ──┬──> Step 3 (Backend Tests)
                         │
                         └──> Step 4 (Frontend Gaps)

Step 3 (Backend Tests) ──> Step 6 (E2E Tests)

Step 4 (Frontend Gaps) ──> Step 5 (Frontend Tests)

Step 5 (Frontend Tests) ──> Step 6 (E2E Tests)

Step 6 (E2E Tests) ──> Step 9 (Performance)

Step 7 (Docker & Deploy) ──> Step 8 (Observability)

Step 8 (Observability) ──> Step 9 (Performance)

Step 9 (Performance) ──> Step 10 (Pre-Launch Polish)
```

**Parallelism**:
- After Step 0: Steps 1 and 7 run in parallel
- After Step 2: Steps 3 and 4 run in parallel
- Steps 3/4/5 and Steps 7/8 are independent tracks that converge at Step 9

**Serial chains**:
- Track A: 0 → 1 → 2 → 3 → 6 → 9 → 10
- Track B: 0 → 1 → 2 → 4 → 5 → 6
- Track C: 0 → 7 → 8 → 9

---

## Step 0: Infrastructure & Test Foundation

**Branch**: `feat/infra-foundation`
**Model tier**: default
**Depends on**: None (first step)
**Estimated scope**: 1 PR, ~6 files

### Context Brief

Before any feature work, establish the infrastructure that all subsequent steps depend on: test database provisioning, coverage tooling, and fixing the PostGIS image mismatch between dev and prod Docker configs. Currently `docker-compose.yml` uses `postgis/postgis:15-3.4` (correct) but `docker-compose.prod.yml` uses `postgres:16-alpine` (missing PostGIS). Backend tests need a real Postgres instance, which Docker provides.

### Tasks

- [ ] **Fix docker-compose.prod.yml**: Change `postgres:16-alpine` to `postgis/postgis:15-3.4` to match dev. Verify PostGIS extension is enabled
- [ ] **Add test database service**: Add a `postgres-test` service to `docker-compose.yml` on port 5434 with database name `viraha_test`
- [ ] **Backend test setup**: Update `backend/src/__tests__/setup.ts` to:
  - Set `DATABASE_URL` to the test database
  - Run `prisma migrate deploy` before tests
  - Truncate all tables between test suites
  - Export helper functions: `cleanDatabase()`, `closeDatabase()`
- [ ] **Install coverage tooling**: `cd backend && npm install -D @vitest/coverage-v8` and `cd frontend && npm install -D @vitest/coverage-v8`
- [ ] **Add test scripts**: Add `"test:coverage": "vitest run --coverage"` to both `backend/package.json` and `frontend/package.json`
- [ ] **Configure vitest**: Ensure `backend/vitest.config.ts` exists with `setupFiles: ['./src/__tests__/setup.ts']` and `coverage.provider: 'v8'`

### Verification

```bash
docker compose up -d postgres postgres-test redis
cd backend && npx vitest run --reporter=verbose  # placeholder tests pass with test DB
cd frontend && npx vitest run --reporter=verbose  # placeholder test passes
```

### Exit Criteria

- `docker compose up postgres-test` starts a PostGIS-enabled test database on port 5434
- `docker-compose.prod.yml` uses the PostGIS image
- `npm run test` works in both backend and frontend
- `npm run test:coverage` produces a coverage report (even if low)
- `backend/vitest.config.ts` exists with proper setup

### Rollback

```bash
git checkout main -- docker-compose.yml docker-compose.prod.yml
cd backend && npm uninstall @vitest/coverage-v8
cd frontend && npm uninstall @vitest/coverage-v8
```

---

## Step 1: Schema Completion & Migration

**Branch**: `feat/schema-completion`
**Model tier**: default
**Depends on**: Step 0
**Estimated scope**: 1 PR, ~5 files

### Context Brief

The Prisma schema is ~80% complete but has gaps vs `docs/06-data-models.md`. Coordinates are stored as `Decimal` (lat/lng columns) instead of PostGIS `GEOGRAPHY(POINT)`. Several date/metadata fields are missing. This step brings the schema to full parity with the data model docs for Phase 2 features only. Scrapbook model is Phase 3 and is **not** included.

**Existing schema location**: `backend/prisma/schema.prisma`
**Existing models**: User, Post, Album, AlbumPost, Journal, JournalEntry, Follow, Comment, Save, Activity, RefreshToken, PasswordReset, Report

### Tasks

- [ ] Add missing fields to `Journal` model: `startDate DateTime?`, `endDate DateTime?`, `wordCount Int @default(0)`, `viewCount Int @default(0)`, `publishedAt DateTime?`
- [ ] Add missing fields to `JournalEntry` model: `date DateTime?`, `weatherCondition String?`, `weatherTemp Decimal?`, `weatherUnit String?`
- [ ] Add missing fields to `Album` model: `startDate DateTime?`, `endDate DateTime?`, `viewCount Int @default(0)`
- [ ] Add `showLocation Boolean @default(true)` to `Post` model
- [ ] **PostGIS migration**: Create a raw SQL migration that:
  - Adds `location GEOGRAPHY(POINT)` columns to `posts`, `albums` (as `primary_location`), `journals` (as `primary_location`), and `users` (as `home_location`)
  - Populates from existing `locationLat`/`locationLng` (or `homeLat`/`homeLng`) Decimal columns: `UPDATE posts SET location = ST_SetSRID(ST_MakePoint("locationLng"::float, "locationLat"::float), 4326)::geography WHERE "locationLat" IS NOT NULL`
  - Creates GiST spatial indexes on the new geography columns
  - Keeps the Decimal columns for now (Prisma can't natively query PostGIS — the geography columns will be used via raw SQL queries for geospatial operations)
- [ ] Add composite indexes: `@@index([userId, privacy, postedAt])` on Post, `@@index([userId, createdAt])` on Activity
- [ ] Generate and apply migration: `npx prisma migrate dev --name schema-completion`

### Verification

```bash
cd backend
npx prisma migrate dev --name schema-completion
npx prisma validate
npx tsc --noEmit
# Verify PostGIS columns exist:
docker compose exec postgres psql -U viraha -d viraha -c "SELECT column_name FROM information_schema.columns WHERE table_name='posts' AND column_name='location'"
```

### Exit Criteria

- `npx prisma validate` passes
- `npx tsc --noEmit` passes
- Migration files exist in `prisma/migrations/`
- PostGIS geography columns exist on posts, albums, journals, users tables
- GiST indexes exist on geography columns
- All existing API endpoints still work (no breaking changes)

### Rollback

```bash
cd backend && npx prisma migrate reset  # dev only — drops and recreates DB
```

---

## Step 2: Backend API Gaps

**Branch**: `feat/backend-api-gaps`
**Model tier**: default
**Depends on**: Step 1
**Estimated scope**: 1 PR, ~12 files

### Context Brief

The backend has controllers for all major features but some documented endpoints are missing or incomplete. This step fills API gaps needed for Phase 2 completion. **Scrapbook is Phase 3 — not included.** The existing `Save` model (`saveController.ts`, `routes/saves.ts`) handles the "save to collection" use case for MVP.

**Key files**:
- Controllers: `backend/src/controllers/`
- Routes: `backend/src/routes/`
- Validators: `backend/src/validators/`
- Auth middleware: `backend/src/middleware/auth.ts` (already supports cookie + Bearer)

### Tasks

- [ ] **Follow list endpoints**: Add `GET /users/:username/followers` and `GET /users/:username/following` to `routes/users.ts` with pagination. Add corresponding handlers in `userController.ts`
- [ ] **Album date range**: Update `albumValidators.ts` to accept optional `startDate`/`endDate`. Update `albumController.ts` create/update to persist these fields
- [ ] **Journal publish flow**: Add `POST /journals/:id/publish` to `routes/journals.ts` that sets `status: 'published'`, `publishedAt: new Date()`. Add handler in `journalController.ts`. Add validation: only owner can publish, journal must have at least 1 entry
- [ ] **Journal word count**: Update journal entry create/update in `journalController.ts` to recalculate parent journal's `wordCount` from all entries' content length
- [ ] **Privacy filtering audit**: Review `postController.ts`, `albumController.ts`, `journalController.ts` list endpoints. Ensure:
  - Unauthenticated: only `privacy: 'public'` and `isDeleted: false`
  - Authenticated non-follower: only `public`
  - Authenticated follower: `public` + `followers`
  - Owner: all (including `private`)
- [ ] **Soft delete audit**: Grep all `findMany` calls, ensure they include `isDeleted: false` where applicable
- [ ] **Feed endpoint**: Verify `feedController.ts` returns posts from followed users in reverse chronological order. Add `startDate`/`endDate` to album data in feed responses

### Verification

```bash
cd backend && npx tsc --noEmit
# Start the dev stack and run integration checks:
docker compose up -d postgres redis
npm run dev &
sleep 3
# Register a test user and capture token:
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"testpass123"}' \
  | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data.accessToken))")
# Test follow endpoints:
curl -s http://localhost:4000/api/v1/users/testuser/followers -H "Authorization: Bearer $TOKEN" | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);process.exit(r.success?0:1)})"
# Test privacy: unauthenticated should only see public posts
curl -s http://localhost:4000/api/v1/posts | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);process.exit(r.success?0:1)})"
kill %1
```

### Exit Criteria

- `npx tsc --noEmit` passes
- Follow list endpoints return paginated results
- Journal publish endpoint works (sets status + publishedAt)
- Album creation accepts startDate/endDate
- Privacy filtering returns correct results for each auth level
- All list queries include `isDeleted: false`

### Rollback

```bash
git checkout main -- backend/src/controllers/ backend/src/routes/ backend/src/validators/
```

---

## Step 3: Backend Test Suite

**Branch**: `feat/backend-tests`
**Model tier**: strongest (test architecture decisions)
**Depends on**: Steps 0, 1, 2
**Estimated scope**: 1 PR, ~20 files

### Context Brief

Backend has 0% effective test coverage (2 placeholder tests with `expect(true).toBe(true)`). The project uses Vitest (configured in Step 0 with test database). This step builds a comprehensive test suite targeting 80%+ coverage on controllers and validators.

**Test infrastructure** (from Step 0):
- Test database: `postgres-test` service on port 5434, database `viraha_test`
- Setup file: `backend/src/__tests__/setup.ts` with `cleanDatabase()` helper
- Vitest config: `backend/vitest.config.ts` with setupFiles pointing to setup.ts
- Coverage: `@vitest/coverage-v8` installed, `npm run test:coverage` available

**Backend stack**: Express 5.2, Prisma ORM, Zod validation (zod/v4), JWT auth via cookies + Bearer, CSRF via csrf-csrf

### Tasks

- [ ] **Test factories** (`__tests__/factories.ts`): Export `createTestUser(overrides?)`, `createTestPost(userId, overrides?)`, `createTestJournal(userId, overrides?)`, `createTestAlbum(userId, overrides?)` that create records via Prisma and return the created objects. Include a `getAuthCookie(userId)` helper that generates a valid access token cookie string
- [ ] **Auth tests** (`__tests__/auth.test.ts`): Replace placeholders. Test: register (success + duplicate email/username), login (success + wrong password), refresh token (cookie + body), logout (clears cookies), CSRF token endpoint returns token, change-password, forgot-password, reset-password
- [ ] **Post tests** (`__tests__/posts.test.ts`): CRUD operations, privacy filtering (create private post → unauthenticated GET returns 0 results), search, pagination, soft delete
- [ ] **Album tests** (`__tests__/albums.test.ts`): CRUD, add/remove posts, startDate/endDate persisted, date range returned in responses
- [ ] **Journal tests** (`__tests__/journals.test.ts`): CRUD, entries CRUD, publish flow (must have entry), wordCount recalculation
- [ ] **Comment tests** (`__tests__/comments.test.ts`): Create, reply (nested), delete, pagination
- [ ] **Follow tests** (`__tests__/follows.test.ts`): Follow, unfollow, list followers/following with pagination, cannot follow self
- [ ] **Feed tests** (`__tests__/feed.test.ts`): Feed includes followed users' public posts, excludes private posts from non-followed users
- [ ] **Validator tests** (`__tests__/validators.test.ts`): Test each Zod schema with invalid inputs (missing required fields, wrong types, too-long strings) and valid inputs
- [ ] **Middleware tests** (`__tests__/middleware.test.ts`): Cookie auth works, Bearer auth works, missing token returns 401, expired token returns 401, CSRF enforcement on POST/PUT/DELETE
- [ ] **Security tests** (`__tests__/security.test.ts`): XSS payload in caption stored but not executed (Prisma parameterization), report endpoint rejects invalid targetId (non-UUID), JWT placeholder secret rejected in production mode
- [ ] Update CI: Add `npm run test` to `.github/workflows/ci.yml` backend job, running after `docker compose up -d postgres-test`

### Verification

```bash
docker compose up -d postgres-test redis
cd backend && npm run test -- --reporter=verbose
npm run test:coverage  # check coverage report
```

### Exit Criteria

- All test suites pass (0 failures)
- Coverage: 80%+ on `controllers/`, `middleware/`, `validators/`
- CI runs backend tests with test database
- Privacy filtering has explicit test cases for each auth level

### Rollback

```bash
# Test files only — no production code changes
rm -rf backend/src/__tests__/*.test.ts backend/src/__tests__/factories.ts
git checkout main -- .github/workflows/ci.yml
```

---

## Step 4: Frontend Feature Gaps

**Branch**: `feat/frontend-gaps`
**Model tier**: default
**Depends on**: Step 2 (for new API endpoints)
**Estimated scope**: 1 PR, ~12 files

### Context Brief

Frontend pages are ~90% complete. Key gaps: profile doesn't show follower/following lists, journal lacks publish button, album doesn't display date ranges. The existing `/saved` page uses the `Save` model — this is sufficient for MVP (Scrapbook is Phase 3).

**Key locations**:
- Pages: `frontend/src/app/(app)/`
- Hooks: `frontend/src/lib/hooks/`
- API: `frontend/src/lib/api/`
- Types: `frontend/src/lib/types/index.ts`
- Stores: `frontend/src/lib/stores/`

### Tasks

- [ ] **Profile followers/following**: On `profile/[username]/page.tsx`, add follower count and following count display. Add a click-to-open modal/drawer that lists followers or following (paginated). Create `lib/api/follows.ts` with `getFollowers(username)`, `getFollowing(username)`. Create `lib/hooks/use-follows.ts`
- [ ] **Journal publish button**: On `journals/[id]/page.tsx`, add a "Publish" button (visible only to owner, only when `status === 'draft'`). Calls `POST /journals/:id/publish`. On success, update local query cache and show toast
- [ ] **Album date range**: Update album creation form (`create/album/page.tsx`) to include optional start/end date pickers. Update album detail page to display date range. Update `lib/types/index.ts` Album type with `startDate`, `endDate`
- [ ] **Journal types update**: Add `startDate`, `endDate`, `wordCount`, `viewCount`, `publishedAt` to Journal type. Add `date`, `weatherCondition`, `weatherTemp`, `weatherUnit` to JournalEntry type
- [ ] **Error boundaries**: Add `error.tsx` to `(auth)` and `(marketing)` route groups if missing
- [ ] **Loading states**: Add `loading.tsx` to pages that fetch data but lack skeletons: check `explore`, `activity`, `albums`, `saved`

### Verification

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep -v "radix-ui\|class-variance-authority\|embla-carousel\|next-themes"  # should be empty
npm run build
```

### Exit Criteria

- `npm run build` succeeds
- Profile page shows follower/following counts with list modal
- Journal detail has working publish button
- Album creation form has date range fields
- All route groups have `error.tsx`

### Rollback

```bash
git checkout main -- frontend/src/
```

---

## Step 5: Frontend Test Suite

**Branch**: `feat/frontend-tests`
**Model tier**: default
**Depends on**: Steps 0, 4
**Estimated scope**: 1 PR, ~15 files

### Context Brief

Frontend has 1 placeholder test (`__tests__/app.test.tsx`). Need unit tests for stores/utils/api and component tests for critical UI. Project uses Vitest (configured in Step 0 with coverage tooling).

**Test infrastructure** (from Step 0):
- Vitest with jsdom (needs configuring)
- `@vitest/coverage-v8` installed
- `npm run test:coverage` available

**Frontend stack**: Next.js 14+ App Router, React 18, MUI, Zustand, TanStack Query, axios

### Tasks

- [ ] **Test setup**: Create `frontend/vitest.config.ts` with `environment: 'jsdom'`. Install `@testing-library/react`, `@testing-library/jest-dom`, `msw` (for API mocking)
- [ ] **MSW setup**: Create `frontend/src/__tests__/msw-handlers.ts` with mock handlers for auth endpoints (login, register, me, csrf-token)
- [ ] **Store tests** (`__tests__/stores/auth-store.test.ts`): Test `setUser`, `logout`, `isAuthenticated`, persist migration from v0 (with tokens) to v1 (without)
- [ ] **Utility tests** (`__tests__/utils/sanitize-html.test.ts`): Test that `<img src=x onerror=alert(1)>` is stripped, `<script>` tags removed, allowed tags (`p`, `strong`, `img` with `src`/`alt`) preserved, empty string returns empty
- [ ] **API client tests** (`__tests__/api/client.test.ts`): Test `withCredentials` is true, CSRF header attached on POST, refresh interceptor redirects on 401
- [ ] **Component tests** (`__tests__/components/auth-guard.test.tsx`): Renders children when user exists, returns null when no user
- [ ] **Hook tests** (`__tests__/hooks/use-auth.test.ts`): Calls getMe on mount, sets user on success
- [ ] Update CI: Add `npm run test` to frontend CI job

### Verification

```bash
cd frontend && npm run test -- --reporter=verbose
npm run test:coverage
```

### Exit Criteria

- All tests pass
- Coverage 80%+ on `lib/stores/`, `lib/utils/`, `lib/api/`
- CI runs frontend tests on push/PR

### Rollback

```bash
rm -rf frontend/src/__tests__/ frontend/vitest.config.ts
npm uninstall @testing-library/react @testing-library/jest-dom msw
git checkout main -- .github/workflows/ci.yml
```

---

## Step 6: End-to-End Tests

**Branch**: `feat/e2e-tests`
**Model tier**: default
**Depends on**: Steps 2, 3, 4, 5
**Estimated scope**: 1 PR, ~10 files

### Context Brief

With unit and integration tests in place, E2E tests verify critical user flows work across the full stack. Use Playwright.

**Prerequisites**: Backend running on :4000 with test database, frontend on :3000. Docker Compose provides Postgres + Redis.

### Tasks

- [ ] Install Playwright: `cd frontend && npm install -D @playwright/test && npx playwright install --with-deps chromium`
- [ ] Create `frontend/playwright.config.ts`: baseURL `http://localhost:3000`, webServer commands to start backend and frontend, timeout 30s
- [ ] Create `frontend/e2e/` directory for test files
- [ ] **Auth flow** (`e2e/auth.spec.ts`): Register new user → verify redirected to home → see dashboard → logout → login → verify home again
- [ ] **Post creation flow** (`e2e/post.spec.ts`): Login → navigate to create post → fill caption and location → submit → verify post visible
- [ ] **Journal flow** (`e2e/journal.spec.ts`): Login → create journal → add entry with rich text → save → verify content displayed → verify XSS payload `<img src=x onerror=alert(1)>` is stripped on render
- [ ] **Map flow** (`e2e/map.spec.ts`): Login → navigate to map → verify map renders (canvas element present) → verify filter controls visible
- [ ] **Profile flow** (`e2e/profile.spec.ts`): Login → visit own profile → verify username displayed → verify stats section exists
- [ ] Add `e2e-results/`, `test-results/`, `playwright-report/` to `.gitignore`
- [ ] Add E2E job to CI (non-blocking `continue-on-error: true` initially)

### Verification

```bash
docker compose up -d postgres redis
cd backend && npm run dev &
cd frontend && npm run dev &
sleep 5
npx playwright test --reporter=html
kill %1 %2
```

### Exit Criteria

- All E2E tests pass against local dev stack
- XSS test confirms sanitization (no script execution)
- CI has E2E job (non-blocking)
- Screenshots captured on failure for debugging

### Rollback

```bash
rm -rf frontend/e2e/ frontend/playwright.config.ts
npm uninstall @playwright/test
git checkout main -- .github/workflows/ci.yml .gitignore
```

---

## Step 7: Docker & Deployment Pipeline

**Branch**: `feat/docker-deploy`
**Model tier**: default
**Depends on**: Step 0
**Estimated scope**: 1 PR, ~8 files

### Context Brief

Docker Compose has Postgres + Redis services (and test database from Step 0). Need a backend app container for local full-stack dev and production deployment config. The project targets Vercel (frontend) + Railway (backend) for MVP hosting.

**Existing files**:
- `docker-compose.yml`: postgres (port 5433), redis (port 6379) — Step 0 added postgres-test (port 5434)
- `docker-compose.prod.yml`: exists with backend/frontend service definitions but may lack Dockerfiles. Step 0 fixed the PostGIS image.
- No `backend/Dockerfile` exists yet

**Frontend deploys to Vercel** (static + SSR, no Docker needed). Backend needs Docker for Railway/any container host.

### Tasks

- [ ] **Backend Dockerfile** (`backend/Dockerfile`): Multi-stage build:
  - Stage 1 (build): `node:20-alpine`, install deps, copy source, `npx prisma generate`, `npm run build`
  - Stage 2 (production): `node:20-alpine`, copy `dist/`, `node_modules/`, `prisma/`, expose 4000, CMD: `npx prisma migrate deploy && node dist/server.js`
- [ ] **docker-compose.yml backend service**: Add `backend` service that builds from `./backend/Dockerfile`, depends_on postgres + redis, maps port 4000, reads env from `.env`
- [ ] **docker-compose.prod.yml update**: Ensure it references `backend/Dockerfile`, uses production env vars, has health checks (`curl -f http://localhost:4000/health`), proper restart policy
- [ ] **Health check upgrade**: In `backend/src/app.ts`, update `/health` endpoint to check database connectivity via `prisma.$queryRaw\`SELECT 1\`` — return `{ status: 'ok', db: 'connected' }` or 503 with `{ status: 'degraded', db: 'disconnected' }`
- [ ] **Environment files**: Create `backend/.env.example` listing all vars from `config/env.ts` with placeholder values and comments. Create `frontend/.env.local.example` with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_R2_URL`
- [ ] **GitHub Actions deploy workflow** (`.github/workflows/deploy.yml`): On push to `main`, build backend Docker image, push to `ghcr.io/akhillhomie/viraha-backend`, tag with `latest` and git SHA
- [ ] **Railway config**: Add `railway.toml` with `[build] builder = "dockerfile"` and `[deploy] healthcheckPath = "/health"`

### Verification

```bash
docker compose up --build -d  # all services start
sleep 10  # wait for migrations
curl -f http://localhost:4000/health  # should return { status: ok, db: connected }
docker compose logs backend | tail -20  # no crash loops
docker compose down
```

### Exit Criteria

- `docker compose up --build` starts postgres, redis, backend
- Health check returns 200 with `db: connected`
- `.env.example` files are complete and accurate
- Deploy workflow exists and builds Docker image
- `railway.toml` exists

### Rollback

```bash
rm backend/Dockerfile railway.toml
git checkout main -- docker-compose.yml docker-compose.prod.yml .github/workflows/
```

---

## Step 8: Observability & Monitoring

**Branch**: `feat/observability`
**Model tier**: default
**Depends on**: Step 7
**Estimated scope**: 1 PR, ~8 files

### Context Brief

Sentry is partially set up. Backend has `src/lib/sentry.ts`. Frontend has `@sentry/nextjs` installed. Need to complete the integration and replace `console.log/error` with structured logging.

**Key files**:
- `backend/src/lib/sentry.ts` — exists, needs verification
- `backend/src/middleware/errorHandler.ts` — current error handler
- `backend/src/app.ts` — uses `morgan('dev')` for request logging
- `frontend/sentry.client.config.ts`, `sentry.server.config.ts` — may or may not exist

### Tasks

- [ ] **Install pino**: `cd backend && npm install pino pino-pretty && npm install -D @types/pino`
- [ ] **Create logger utility** (`backend/src/lib/logger.ts`): Export a pino logger configured with `level: env.NODE_ENV === 'production' ? 'info' : 'debug'`, transport: `pino-pretty` in development
- [ ] **Request logging**: Replace `morgan('dev')` in `app.ts` with a pino-http middleware or a custom middleware that logs `{ method, url, statusCode, responseTime, userId }`
- [ ] **Replace console.log/error**: In all backend controllers, replace `console.error` with `logger.error` (with context: `{ err, userId, endpoint }`)
- [ ] **Sentry backend**: In `errorHandler.ts`, add `Sentry.captureException(err)` before sending the response (only when `SENTRY_DSN` is set). Ensure user context is attached
- [ ] **Sentry frontend**: Verify `sentry.client.config.ts` exists. If not, create with `Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, tracesSampleRate: 0.1 })`. Ensure `global-error.tsx` reports to Sentry
- [ ] **Env var**: Add `SENTRY_DSN` to `backend/.env.example` and `NEXT_PUBLIC_SENTRY_DSN` to `frontend/.env.local.example`

### Verification

```bash
cd backend && npx tsc --noEmit
cd ../frontend && npm run build
# Verify no console.log/error in controllers:
cd ../backend && grep -r "console\.\(log\|error\)" src/controllers/ | wc -l  # should be 0
```

### Exit Criteria

- `npx tsc --noEmit` passes (both)
- `grep -r "console\.\(log\|error\)" backend/src/controllers/` returns 0 matches
- Request logs are structured JSON in production mode
- Sentry DSN configurable via env var (backend + frontend)
- Error handler sends to Sentry when DSN is set

### Rollback

```bash
git checkout main -- backend/src/ frontend/sentry.* frontend/src/app/global-error.tsx
cd backend && npm uninstall pino pino-pretty
```

---

## Step 9: Performance Optimization

**Branch**: `feat/performance`
**Model tier**: default
**Depends on**: Steps 6, 8
**Estimated scope**: 1 PR, ~10 files

### Context Brief

With tests and observability in place, optimize hot paths guided by structured logs. Target: <2s page load, <200ms API p95 for feed/explore endpoints.

**Key areas to profile**:
- `feedController.ts` and `exploreController.ts` — most traffic
- `postController.ts` getPosts — frequently called
- Frontend bundle size — map and editor are heavy
- Redis cache: `lib/cache.ts` exists but may not be fully wired up

### Tasks

- [ ] **Measure baseline**: Add a timing log to feed endpoint, run 10 requests, record p50/p95. Document in PR description
- [ ] **Prisma select optimization**: Add `select` to Prisma queries in `postController.ts`, `feedController.ts`, `userController.ts` to exclude `passwordHash` and unnecessary relation fields
- [ ] **N+1 audit**: Check feed/explore controllers for queries inside loops. Use Prisma `include` with `select` instead of separate queries
- [ ] **Redis cache verification**: Ensure `cache.ts` is called in `feedController.ts` and `exploreController.ts`. If not connected, wire it up with 5-min TTL for feed, 15-min for trending
- [ ] **Lazy-load heavy components**: In frontend, ensure map component (`components/ui/map.tsx`) and rich text editor (`components/journal/rich-text-editor.tsx`) are loaded via `next/dynamic` with `ssr: false`
- [ ] **Image optimization**: Audit frontend for `<img>` tags that should be `next/image`. Ensure R2-hosted images go through Next.js image optimization
- [ ] **Verify with tests**: Run full backend test suite to ensure no regressions

### Verification

```bash
cd backend && npm run test  # no regressions
cd ../frontend && npm run build  # check output for bundle sizes
# Measure API response time:
docker compose up -d
cd backend && npm run dev &
sleep 3
for i in {1..10}; do curl -s -o /dev/null -w "%{time_total}\n" http://localhost:4000/api/v1/feed; done
kill %1
```

### Exit Criteria

- All tests pass
- Feed endpoint p95 <200ms (local, with warm cache)
- Map and editor are dynamically imported (check with `grep "dynamic(" frontend/src/`)
- No `<img>` tags for user content in frontend (use `next/image` or sanitized HTML)
- PR description includes before/after timing measurements

### Rollback

```bash
git checkout main -- backend/src/controllers/ frontend/src/
```

---

## Step 10: Pre-Launch Polish & Documentation

**Branch**: `feat/pre-launch-polish`
**Model tier**: default
**Depends on**: All previous steps
**Estimated scope**: 1 PR, ~12 files

### Context Brief

Final polish before beta launch. Focus on production configuration, documentation accuracy, and CSP enforcement. Keep scope tight — this is not an accessibility rewrite.

**Key files**:
- `README.md` — outdated, says "Planning & Documentation Phase"
- `docs/17-setup-guide.md` — may not reflect Docker setup
- `frontend/next.config.ts` — has CSP as `Report-Only`
- `.gitignore` — may be missing entries

### Tasks

- [ ] **README update**: Update root `README.md` — remove "Planning Phase", add accurate setup instructions (Docker Compose + npm), list implemented features, link to API docs
- [ ] **Setup guide update**: Update `docs/17-setup-guide.md` with Docker Compose setup, test database, environment variable documentation
- [ ] **CSP enforcement**: In `frontend/next.config.ts`, change `Content-Security-Policy-Report-Only` to `Content-Security-Policy` (enforcing mode)
- [ ] **Meta tags**: Verify `frontend/src/app/layout.tsx` has complete OG tags. Add OG image if missing (`public/og-image.png`)
- [ ] **Favicon check**: Verify `favicon.ico` and `apple-touch-icon.png` exist in `frontend/public/`
- [ ] **404 page**: Verify `not-found.tsx` exists in `(app)` route group and renders a helpful message
- [ ] **Git cleanup**: Add `.DS_Store`, `*.log`, `.env`, `.env.local`, `e2e-results/`, `test-results/`, `playwright-report/`, `coverage/` to `.gitignore`. Remove any committed `.DS_Store` files: `git rm -r --cached '*.DS_Store'`
- [ ] **License**: Add MIT `LICENSE` file
- [ ] **Verify full test suite passes**: Run backend tests, frontend tests, E2E tests, and build

### Verification

```bash
cd backend && npm run test
cd ../frontend && npm run test && npm run build
npx playwright test
# Check CSP is enforcing:
curl -s -I http://localhost:3000 | grep -i "content-security-policy"  # should NOT say "report-only"
# Check no secrets in repo:
grep -r "CHANGE_ME\|secret_key\|password123" . --include="*.ts" --include="*.env" -l  # should only match .env.example
```

### Exit Criteria

- All tests pass (unit, integration, E2E)
- CSP header is enforcing (not report-only)
- README accurately describes how to run the project
- No `.DS_Store` or `.env` files in git
- `LICENSE` file exists
- `npm run build` succeeds for frontend

### Rollback

```bash
git checkout main -- README.md docs/ frontend/next.config.ts .gitignore
```

---

## Invariants (verified after every step)

1. `cd backend && npx tsc --noEmit` — zero errors
2. `cd frontend && npx tsc --noEmit` — zero errors (excluding pre-existing radix-ui/shadcn errors in unused components)
3. `cd frontend && npm run build` — succeeds
4. `docker compose up` — postgres and redis start (after Step 7: full stack starts)
5. Existing functionality does not regress — verified by running test suite when it exists

## Anti-Patterns to Avoid

- **Over-engineering**: Don't add GraphQL, microservices, or event sourcing. Express + Prisma + REST is the right level for MVP.
- **Premature optimization**: Don't add caching to endpoints that aren't slow. Measure first (Step 9). Don't tree-shake unless bundle sizes are actually problematic.
- **Test theater**: Don't write tests that test the framework (e.g., "React renders a div"). Test business logic and user flows.
- **Scope creep**: Don't implement Phase 3/4 features — specifically: Scrapbook (use existing Save model), real-time notifications, mobile app, advanced search filters, Algolia integration. Ship Phase 2 first.
- **Bikeshedding config**: Don't spend time on ESLint rules, Prettier config, or folder restructuring. Ship features.
- **Save/Scrapbook confusion**: The existing `Save` model handles "save a post to my collection" for MVP. The full Scrapbook (folders, external links, multiple content types) is Phase 3. Do not build both systems.

## Plan Mutation Protocol

- **Split a step**: Create `step-N-a` and `step-N-b` branches. Update dependency edges in this doc.
- **Skip a step**: Mark as `SKIPPED: <reason>`. Verify downstream steps don't depend on skipped outputs.
- **Insert a step**: Add between existing steps. Use `step-N.5` naming. Update graph.
- **Reorder**: Only if dependency graph allows. Update this doc.
- **Abandon**: Mark as `ABANDONED: <reason>`. Do not delete — future sessions need the context.

## Revision History

- **v1.0**: Initial draft
- **v2.0**: Post-adversarial review. Fixed dependency graph (CRITICAL), dropped Scrapbook scope (Phase 3), added Step 0 for infra foundation, added PostGIS migration to Step 1, fixed Step 2 verification with automated curl checks, added test DB provisioning, fixed parallel safety claims.
