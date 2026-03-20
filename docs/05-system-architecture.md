# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Web App (Next.js)          Mobile App (React Native)       │
│  - SSR/SSG Pages            - iOS                           │
│  - Client Components        - Android                       │
│  - PWA Support              - Native Features               │
└────────────────┬─────────────────────────┬──────────────────┘
                 │                         │
                 │    HTTPS / WebSocket    │
                 │                         │
┌────────────────┴─────────────────────────┴──────────────────┐
│                      API GATEWAY                             │
├─────────────────────────────────────────────────────────────┤
│  - Route Management                                          │
│  - Authentication (JWT)                                      │
│  - Rate Limiting                                             │
│  - Request Validation                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───┴────────┐      ┌────────┴─────┐
│  REST API  │      │  WebSocket   │
│  (Express) │      │   Server     │
└───┬────────┘      └────────┬─────┘
    │                        │
    │   ┌────────────────────┤
    │   │                    │
┌───┴───┴────────────────────┴─────────────────────────────────┐
│                     SERVICE LAYER                             │
├──────────────────────────────────────────────────────────────┤
│  AuthService     PostService      AlbumService               │
│  UserService     JournalService   FeedService                │
│  GeoService      MediaService     SearchService              │
│  SocialService   NotificationService                         │
└────┬────────────────┬──────────────┬────────────────────────┘
     │                │              │
┌────┴────┐     ┌────┴────┐    ┌───┴──────┐
│   PG    │     │  Redis  │    │  S3/R2   │
│PostGIS  │     │  Cache  │    │  Media   │
└─────────┘     └─────────┘    └──────────┘
     │                              │
┌────┴─────────────┐    ┌──────────┴────────┐
│  Algolia/Elastic │    │  CloudFlare CDN   │
│     Search       │    │                   │
└──────────────────┘    └───────────────────┘
```

---

## Technology Stack

### Frontend

**Web Application**:
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 18+
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: 
  - Zustand (client state)
  - React Query / TanStack Query (server state)
- **Maps**: Mapbox GL JS
- **Forms**: React Hook Form + Zod validation
- **Image Handling**: next/image with optimization

**Mobile Application** (Phase 4):
- **Framework**: React Native
- **Navigation**: React Navigation
- **Maps**: Mapbox React Native
- **Offline**: WatermelonDB or RxDB

### Backend

**API Server**:
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Validation**: Zod
- **ORM**: Prisma or Drizzle ORM

**Authentication**:
- **Strategy**: JWT with refresh tokens
- **Library**: jsonwebtoken
- **Password Hashing**: bcrypt
- **OAuth** (future): Google, Apple Sign-In

**Real-time**:
- **Protocol**: WebSocket (ws or socket.io)
- **Use Cases**: Live notifications, feed updates

### Database

**Primary Database**:
- **System**: PostgreSQL 15+
- **Extension**: PostGIS for geospatial queries
- **Connection Pool**: pg-pool
- **Migration**: Prisma Migrate or Drizzle Kit

**Cache Layer**:
- **System**: Redis 7+
- **Use Cases**:
  - Session storage
  - Feed caching
  - Rate limiting
  - Temporary data (uploads, tokens)

**Search Engine**:
- **System**: Algolia (managed) or Elasticsearch (self-hosted)
- **Indexed**: Posts, Albums, Journals, Users, Locations
- **Features**: Geo-search, faceted search, typo-tolerance

### Storage & Media

**Object Storage**:
- **Service**: Cloudflare R2 (S3-compatible)
- **Alternative**: AWS S3, Digital Ocean Spaces
- **Use Cases**: Photos, videos, user uploads

**CDN**:
- **Service**: Cloudflare
- **Purpose**: Global content delivery, image transformation

**Image Processing**:
- **Library**: Sharp (Node.js)
- **Tasks**: Resize, compress, thumbnail generation
- **Formats**: WebP, JPEG, PNG

### Infrastructure

**Hosting** (MVP):
- **Application**: Vercel (Next.js), Railway/Render (API)
- **Database**: Neon or Supabase (managed Postgres)
- **Redis**: Upstash (serverless Redis)

**Hosting** (Production):
- **Application**: AWS ECS/Fargate or Google Cloud Run
- **Database**: AWS RDS or self-hosted
- **Redis**: AWS ElastiCache
- **CDN**: CloudFlare

**Monitoring**:
- **APM**: Sentry (error tracking)
- **Logs**: Better Stack or CloudWatch
- **Metrics**: Prometheus + Grafana

---

## API Architecture

### REST API Design

**Base URL**: `https://api.viraha.app/v1`

**Authentication**:
```
Authorization: Bearer <access_token>
```

**Response Format**:
```typescript
// Success
{
  success: true,
  data: { ... },
  meta?: { pagination, etc }
}

// Error
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

**Endpoint Structure**:
```
/auth/*           - Authentication endpoints
/users/*          - User management
/posts/*          - Post CRUD
/albums/*         - Album CRUD
/journals/*       - Journal CRUD
/feed/*           - Feed generation
/search/*         - Search functionality
/social/*         - Following, comments
/scrapbook/*      - Saved content
/geo/*            - Location services
/media/*          - Upload handling
```

### Key Endpoints

```typescript
// Authentication
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

// Posts
GET    /posts                  // List posts (filtered, paginated)
GET    /posts/:id              // Get single post
POST   /posts                  // Create post
PATCH  /posts/:id              // Update post
DELETE /posts/:id              // Delete post
GET    /posts/nearby           // Geo-query posts near location

// Albums
GET    /albums
GET    /albums/:id
POST   /albums
PATCH  /albums/:id
DELETE /albums/:id
POST   /albums/:id/posts       // Add posts to album
DELETE /albums/:id/posts/:postId

// Journals
GET    /journals
GET    /journals/:id
POST   /journals
PATCH  /journals/:id
DELETE /journals/:id
GET    /journals/:id/entries
POST   /journals/:id/entries
PATCH  /journals/:id/entries/:entryId

// Feed
GET    /feed                   // Personalized feed
GET    /feed/discover          // Discovery feed
GET    /feed/following         // Following-only feed

// Search
GET    /search/posts?q=...&location=...
GET    /search/users?q=...
GET    /search/locations?q=...

// Social
POST   /social/follow/:userId
DELETE /social/unfollow/:userId
GET    /social/followers
GET    /social/following
POST   /posts/:id/comments
GET    /posts/:id/comments

// Scrapbook
GET    /scrapbook
POST   /scrapbook
DELETE /scrapbook/:id
PATCH  /scrapbook/:id

// Media Upload
POST   /media/upload           // Get signed upload URL
POST   /media/process          // Trigger processing
```

---

## Data Flow Patterns

### Post Creation Flow

```
1. Client
   ↓ Upload images to signed URL
2. S3/R2 Storage
   ↓ Return URLs
3. Client
   ↓ POST /posts with media URLs + data
4. API Server
   ↓ Validate, create DB record
5. PostgreSQL
   ↓ Return post
6. API Server
   ↓ Trigger async: thumbnail generation, search indexing
7. Background Jobs
   ↓ Process images, update search index
8. Return to Client
```

### Feed Generation Flow

```
1. Client
   ↓ GET /feed
2. API Server
   ↓ Check Redis cache
3. Redis (if cache hit)
   ↓ Return cached feed
4. Redis (if cache miss)
   ↓ Query algorithm
5. PostgreSQL
   ↓ Fetch: following posts, location-based, suggested
6. Feed Algorithm
   ↓ Merge, rank, personalize
7. Redis
   ↓ Cache result (5-15 min TTL)
8. Return to Client
```

### Real-time Notification Flow

```
1. Event occurs (new follow, comment, etc.)
   ↓
2. API Server
   ↓ Emit event to WebSocket server
3. WebSocket Server
   ↓ Identify connected clients
4. Client Connections
   ↓ Push notification payload
5. Client
   ↓ Update UI reactively
```

---

## Security Architecture

### Authentication Flow

```
1. Login Request
   ↓ POST /auth/login {email, password}
2. API Server
   ↓ Verify credentials (bcrypt)
3. Generate Tokens:
   - Access Token (JWT, 15min expiry)
   - Refresh Token (JWT, 7 day expiry, stored in DB)
4. Return Tokens
   ↓ {accessToken, refreshToken}
5. Client stores:
   - accessToken in memory
   - refreshToken in httpOnly cookie
6. Subsequent requests:
   - Authorization: Bearer <accessToken>
7. Token Refresh (when access expires):
   - POST /auth/refresh {refreshToken}
   - Return new accessToken
```

### Authorization Layers

**1. Route-Level**:
```typescript
// Public routes (no auth required)
app.get('/posts', getPosts);

// Protected routes (auth required)
app.get('/feed', authenticateUser, getFeed);

// Owner-only routes
app.patch('/posts/:id', authenticateUser, authorizeOwner, updatePost);
```

**2. Data-Level**:
```typescript
// Privacy filtering in queries
SELECT * FROM posts 
WHERE 
  (privacy = 'public') OR
  (privacy = 'followers' AND user_id IN (SELECT following_id FROM follows WHERE follower_id = $userId)) OR
  (user_id = $userId);
```

**3. Rate Limiting**:
```typescript
// Redis-based rate limiting
- Authenticated: 100 req/min
- Unauthenticated: 20 req/min
- Upload endpoints: 10 req/hour
```

### Data Protection

**Encryption**:
- At rest: Database encryption (provider-managed)
- In transit: TLS 1.3
- Sensitive fields: Additional encryption for payment info (future)

**Input Validation**:
- Zod schemas for all inputs
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize user content)
- File upload validation (type, size limits)

**Privacy Controls**:
- Granular per-content privacy
- User data export (GDPR compliance)
- Account deletion with data purge
- Location precision controls

---

## Scalability Considerations

### Horizontal Scaling

**API Servers**:
- Stateless design (JWT, no server sessions)
- Load balancer distribution
- Auto-scaling based on CPU/memory

**Database**:
- Read replicas for query load
- Connection pooling
- Query optimization and indexing

**Media Storage**:
- CDN for global distribution
- Lazy loading and progressive images
- WebP format adoption

### Caching Strategy

**Redis Caching Layers**:
```typescript
// L1: Hot data (short TTL)
user_profile:{userId}        // 5 min
feed:{userId}                // 10 min

// L2: Warm data (medium TTL)
post:{postId}                // 30 min
album:{albumId}              // 30 min

// L3: Cold data (long TTL)
user_followers:{userId}      // 60 min
location_posts:{lat}:{lng}   // 2 hours
```

**Cache Invalidation**:
- Write-through: Update cache on data modification
- TTL-based: Automatic expiration
- Event-based: Clear on related updates

### Database Optimization

**Indexing Strategy**:
- B-tree indexes: Primary keys, foreign keys, frequently filtered columns
- GiST indexes: Geospatial queries (PostGIS)
- GIN indexes: Full-text search, array columns (tags)

**Query Optimization**:
- N+1 prevention: Use joins and eager loading
- Pagination: Cursor-based for large datasets
- Partial indexes: For filtered queries (e.g., WHERE is_deleted = false)

**Partitioning** (future):
- Time-based partitioning for posts (by month/year)
- User-based sharding if needed

---

## Offline & Sync Strategy

### Offline-First Architecture

**Client-Side**:
- IndexedDB for local storage
- Service Worker for offline access
- Queue system for pending uploads

**Sync Protocol**:
```
1. User creates content offline
   ↓ Store in IndexedDB with status='pending'
2. App regains connectivity
   ↓ Detect online event
3. Sync Queue
   ↓ Process pending items sequentially
4. Upload to server
   ↓ POST /posts with retry logic
5. Server responds
   ↓ Update local record with server ID
6. Clean up
   ↓ Remove from pending queue
```

**Conflict Resolution**:
- Last-write-wins for simple edits
- User prompt for complex conflicts
- Version tracking with timestamps

---

## Monitoring & Observability

### Key Metrics

**Application**:
- Request latency (p50, p95, p99)
- Error rate by endpoint
- Active users (DAU, MAU)
- Upload success rate

**Infrastructure**:
- CPU/Memory usage
- Database connections
- Cache hit ratio
- CDN bandwidth

**Business**:
- New posts created
- Feed engagement
- User retention (D1, D7, D30)
- Storage usage

### Logging Strategy

```typescript
// Structured logging
{
  timestamp: "2026-02-14T10:30:00Z",
  level: "info",
  service: "api",
  userId: "uuid",
  endpoint: "/posts",
  method: "POST",
  duration: 245,
  status: 201,
  metadata: { ... }
}
```

### Alerting

**Critical Alerts**:
- API error rate > 1%
- Database connection failures
- Upload service down
- Feed generation timeout

**Warning Alerts**:
- High memory usage (>80%)
- Slow queries (>1s)
- Cache miss rate >50%

---

## Deployment Architecture

### Development
```
Local Machine
├── Next.js (localhost:3000)
├── Express API (localhost:4000)
├── PostgreSQL (Docker)
└── Redis (Docker)
```

### Staging
```
Vercel (Frontend)
Railway (API)
Neon (Database)
Upstash (Redis)
Cloudflare R2 (Storage)
```

### Production
```
AWS/GCP
├── ECS/Cloud Run (API containers)
├── Vercel Edge (Next.js)
├── RDS/Cloud SQL (PostgreSQL)
├── ElastiCache (Redis)
├── S3/GCS (Media)
└── CloudFlare (CDN)
```

### CI/CD Pipeline

```
GitHub Push
↓
GitHub Actions
├── Lint & Type Check
├── Unit Tests
├── Integration Tests
└── Build
    ↓
    Deploy to Staging
    ↓
    E2E Tests
    ↓
    Manual Approval
    ↓
    Deploy to Production
```

---

## API Versioning

**Strategy**: URL-based versioning

```
v1: /v1/posts     (current)
v2: /v2/posts     (future, with breaking changes)
```

**Deprecation Process**:
1. Announce v2 with a deprecation notice
2. Support both v1 and v2 concurrently
3. Warn v1 users in responses
4. Sunset v1 after sufficient migration period
