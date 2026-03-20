# Technical Architecture

**Viraha** - System Architecture Document

---

## Architecture Overview

Viraha follows a modern, serverless-first architecture optimized for rapid development and scalability.

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Web App     │  │  Mobile App  │  │   PWA        │ │
│  │  (Next.js)   │  │  (React      │  │  (Future)    │ │
│  │              │  │   Native)    │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     API Layer                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Next.js API Routes / tRPC                 │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │  │
│  │  │ Auth   │ │ Posts  │ │ Feed   │ │ Users  │   │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Post    │ │  Album   │ │  Feed    │ │  Geo     │ │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                           │
│  ┌──────────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  PostgreSQL  │  │  Redis   │  │  S3 / R2        │  │
│  │  (Neon)      │  │ (Upstash)│  │  (CloudFlare)   │  │
│  └──────────────┘  └──────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                External Services                        │
│  ┌──────────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │ Google Maps  │  │  Clerk   │  │  Resend         │  │
│  │   Places API │  │  Auth    │  │  Email          │  │
│  └──────────────┘  └──────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

**Framework**: Next.js 14+ (App Router)
- Server Components for performance
- App Router for file-based routing
- Built-in API routes
- Optimized image handling
- TypeScript for type safety

**UI Library**: shadcn/ui + Radix UI
- Accessible components
- Customizable with Tailwind
- No bloated dependencies
- Copy-paste philosophy

**Styling**: Tailwind CSS
- Utility-first approach
- Consistent design system
- Dark mode support
- Mobile-first responsive

**Map Integration**: mapcn (MapLibre GL)
- Self-hosted map tiles
- No Google Maps fees for display
- Customizable styling
- Excellent performance

**State Management**:
- React Query: Server state, caching
- Zustand: Client-side app state
- Context API: UI state (theme, modals)

**Form Handling**: React Hook Form + Zod
- Type-safe validation
- Excellent DX
- Performance optimized
- Works with Server Actions

### Backend

**Runtime**: Node.js / Bun
- Bun for faster dev experience
- Node.js for production stability
- Both supported

**API Layer**: tRPC
- End-to-end type safety
- No code generation needed
- Better DX than REST
- Works with React Query

**Alternative**: Next.js API Routes
- Simpler for basic CRUD
- Built-in with Next.js
- Good for rapid prototyping

**ORM**: Drizzle ORM
- Type-safe queries
- Excellent TypeScript support
- Lightweight
- Migration tools

**Alternative**: Prisma
- More mature ecosystem
- Great admin UI
- Easier for beginners

**Validation**: Zod
- Runtime type checking
- Works with TypeScript
- Shares types with frontend

### Database

**Primary Database**: PostgreSQL (Neon)
- Serverless Postgres
- Excellent free tier
- Branching for dev/staging
- PostGIS for geospatial

**Alternative**: Supabase
- Includes auth
- Real-time subscriptions
- Built-in storage
- More batteries included

**Caching Layer**: Upstash Redis
- Serverless Redis
- Feed caching
- Session storage
- Rate limiting

**Search**: PostgreSQL Full-Text Search
- Built-in, no extra service
- Good enough for MVP
- Can migrate to Algolia later

### Storage

**Media Storage**: CloudFlare R2
- S3-compatible
- No egress fees
- Global CDN
- Affordable

**Alternative**: AWS S3
- More mature
- Better ecosystem
- Predictable pricing

**CDN**: CloudFlare
- Free tier generous
- Global edge network
- Image optimization
- DDoS protection

### Infrastructure

**Hosting**: Vercel
- Optimized for Next.js
- Automatic deployments
- Preview environments
- Excellent DX

**Auth**: Clerk
- Drop-in solution
- Beautiful UI
- Organizations support
- Social logins

**Alternative**: NextAuth.js
- Open source
- More control
- Cost-effective
- Requires more setup

**Email**: Resend
- Modern email API
- React email templates
- Good deliverability
- Simple pricing

**Monitoring**: Vercel Analytics + Sentry
- Performance monitoring
- Error tracking
- User analytics
- Free tiers available

## Architecture Patterns

### API Design

**tRPC Router Structure**:
```typescript
app/
  _trpc/
    routers/
      post.ts      // Post CRUD + feed queries
      album.ts     // Album CRUD
      user.ts      // User profile operations
      follow.ts    // Follow/unfollow
      feed.ts      // Feed generation
      geo.ts       // Location queries
    root.ts        // Root router
    client.ts      // Client setup
```

**Example Router**:
```typescript
// routers/post.ts
export const postRouter = router({
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.post.create(input);
    }),
  
  getFeed: protectedProcedure
    .input(feedInputSchema)
    .query(async ({ ctx, input }) => {
      return await feedService.generate(ctx.user, input);
    }),
  
  getByLocation: publicProcedure
    .input(locationInputSchema)
    .query(async ({ ctx, input }) => {
      return await geoService.findNearby(input);
    }),
});
```

### Service Layer Pattern

```typescript
// services/post.service.ts
export class PostService {
  async create(userId: string, data: CreatePostInput) {
    // 1. Validate location via Google Places API
    const place = await googlePlaces.validate(data.placeId);
    
    // 2. Upload photos to R2
    const photoUrls = await uploadPhotos(data.photos);
    
    // 3. Create post in database
    const post = await db.posts.create({
      userId,
      ...place,
      photos: photoUrls,
      caption: data.caption,
    });
    
    // 4. Create activity for feed
    await db.activities.create({
      userId,
      type: 'post_created',
      targetId: post.id,
      location: place.coordinates,
    });
    
    // 5. Invalidate cache
    await redis.del(`feed:${userId}`);
    
    return post;
  }
}
```

### Feed Generation Algorithm

```typescript
// services/feed.service.ts
export class FeedService {
  async generateLocalFeed(user: User, cursor?: string) {
    // Get following list
    const following = await getFollowing(user.id);
    
    // Get activities from following
    const activities = await db.activities.findMany({
      where: { userId: { in: following } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      cursor,
    });
    
    // Hydrate posts/albums
    const items = await hydrateActivities(activities);
    
    // Personalize ranking
    return personalizeRanking(items, user);
  }
  
  async generateTravelingFeed(user: User, location: Location) {
    // Get recent posts near current location
    const nearbyPosts = await geoService.findPostsNearby({
      lat: location.lat,
      lng: location.lng,
      radius: 50000, // 50km
      limit: 50,
    });
    
    // Boost posts from followed users
    const boosted = boostFollowedUsers(nearbyPosts, user);
    
    // Personalize based on saves/interactions
    return personalizeTravelFeed(boosted, user);
  }
}
```

### Caching Strategy

```typescript
// Redis cache patterns

// 1. Feed caching (5 minutes)
const feedKey = `feed:${userId}:${mode}`;
const cached = await redis.get(feedKey);
if (cached) return JSON.parse(cached);

const feed = await generateFeed(user);
await redis.setex(feedKey, 300, JSON.stringify(feed));

// 2. User profile caching (15 minutes)
const userKey = `user:${userId}`;
await redis.setex(userKey, 900, JSON.stringify(user));

// 3. Location data caching (1 hour)
const locationKey = `place:${placeId}`;
await redis.setex(locationKey, 3600, JSON.stringify(placeData));

// 4. Following list caching (10 minutes)
const followingKey = `following:${userId}`;
await redis.setex(followingKey, 600, JSON.stringify(following));
```

**Cache Invalidation**:
- Post created → Invalidate user's feed cache
- Profile updated → Invalidate user profile cache
- Follow/unfollow → Invalidate following cache
- Post deleted → Invalidate location cache

### Data Flow Examples

**Creating a Post**:
```
User → Frontend Form
  ↓
tRPC Mutation
  ↓
Post Service
  ├─→ Validate Location (Google Places API)
  ├─→ Upload Photos (R2)
  ├─→ Create Post (PostgreSQL)
  ├─→ Create Activity (PostgreSQL)
  └─→ Invalidate Cache (Redis)
  ↓
Return Post + Upload to Client
```

**Generating Feed (Local Mode)**:
```
User Request → tRPC Query
  ↓
Feed Service
  ├─→ Check Cache (Redis)
  │   └─→ If hit: Return cached feed
  │
  └─→ If miss:
      ├─→ Get Following List (PostgreSQL + Redis)
      ├─→ Get Activities (PostgreSQL)
      ├─→ Hydrate Content (PostgreSQL)
      ├─→ Personalize Ranking
      ├─→ Cache Result (Redis)
      └─→ Return Feed
```

**Map Query (Traveling Mode)**:
```
User Location → tRPC Query
  ↓
Geo Service
  ├─→ PostGIS Query (PostgreSQL)
  │   └─→ Find posts within radius
  │
  ├─→ Filter by followed users (boost)
  ├─→ Cluster nearby pins
  └─→ Return map data
```

## Performance Optimization

### Database Optimization

**Indexing Strategy**:
```sql
-- Geospatial queries
CREATE INDEX idx_posts_location ON posts 
  USING GIST(ll_to_earth(place_lat, place_lng));

-- Feed queries
CREATE INDEX idx_activities_user_created ON activities(user_id, created_at DESC);

-- User lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_follows_follower ON follows(follower_id);
```

**Query Optimization**:
- Use prepared statements
- Limit result sets (pagination)
- Select only needed columns
- Use database-level aggregations
- Implement cursor-based pagination

**Connection Pooling**:
```typescript
// Neon serverless driver
import { neon } from '@neondatabase/serverless';

const pool = neon(process.env.DATABASE_URL, {
  poolSize: 10,
  idleTimeout: 30000,
});
```

### Image Optimization

**Upload Pipeline**:
```typescript
// 1. Client-side compression
import imageCompression from 'browser-image-compression';

const compressed = await imageCompression(file, {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
});

// 2. Server-side processing
import sharp from 'sharp';

const optimized = await sharp(buffer)
  .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 85 })
  .toBuffer();

// 3. Generate thumbnails
const thumbnail = await sharp(buffer)
  .resize(400, 400, { fit: 'cover' })
  .webp({ quality: 80 })
  .toBuffer();

// 4. Upload to R2
await uploadToR2({
  full: optimized,
  thumb: thumbnail,
});
```

**CDN Integration**:
- All images served through CloudFlare CDN
- Automatic format conversion (WebP, AVIF)
- Responsive image sizing
- Lazy loading on client

### Frontend Performance

**Code Splitting**:
```typescript
// Dynamic imports for heavy components
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

const RichTextEditor = dynamic(
  () => import('@/components/RichTextEditor'),
  { ssr: false }
);
```

**Data Loading Strategy**:
- Server Components for initial data
- React Query for client-side fetching
- Optimistic updates for better UX
- Infinite scroll with cursor pagination

**Bundle Optimization**:
- Next.js automatic code splitting
- Tree shaking unused code
- Lazy load non-critical JS
- Preload critical resources

## Security

### Authentication & Authorization

**Flow**:
```
1. User signs up/in via Clerk
2. Clerk issues JWT token
3. Token sent with each request
4. tRPC middleware validates token
5. User context attached to request
```

**Middleware**:
```typescript
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
```

### Data Protection

**Input Validation**:
```typescript
import { z } from 'zod';

const createPostSchema = z.object({
  placeId: z.string().min(1),
  caption: z.string().min(1).max(5000),
  photos: z.array(z.string().url()).min(1).max(4),
  modeBadge: z.enum(['local', 'traveling']).optional(),
});
```

**SQL Injection Prevention**:
- Parameterized queries via ORM
- No raw SQL with user input
- Input sanitization at API level

**XSS Prevention**:
- React auto-escapes content
- Sanitize rich text input
- CSP headers configured

**Rate Limiting**:
```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

const { success } = await ratelimit.limit(userId);
if (!success) {
  throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
}
```

### Privacy Controls

**User Data Access**:
- Users own their data
- Can export all content
- Can delete account + all data
- GDPR compliant

**Content Visibility**:
```typescript
// Check if user can view content
async function canViewPost(post: Post, viewer: User | null) {
  if (post.visibility === 'public') return true;
  if (!viewer) return false;
  if (post.userId === viewer.id) return true;
  // Future: friends-only, unlisted, etc.
  return false;
}
```

## Deployment

### Environment Setup

**Production**:
```bash
# .env.production
DATABASE_URL=postgresql://...           # Neon production
REDIS_URL=redis://...                   # Upstash production
R2_ENDPOINT=https://...                 # CloudFlare R2
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_... # Clerk production
GOOGLE_PLACES_API_KEY=...              # Google Places
```

**Development**:
```bash
# .env.local
DATABASE_URL=postgresql://localhost:5432/viraha
REDIS_URL=redis://localhost:6379
# ... development keys
```

### CI/CD Pipeline

**GitHub Actions Workflow**:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

**Database Migrations**:
```bash
# Apply migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Reset database (dev only)
npm run db:reset
```

### Monitoring & Observability

**Application Monitoring**:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});

// Track custom events
Sentry.captureMessage('Post created', {
  level: 'info',
  extra: { postId, userId },
});
```

**Performance Tracking**:
```typescript
// Web Vitals
export function reportWebVitals(metric) {
  if (metric.label === 'web-vital') {
    analytics.track('Web Vital', {
      name: metric.name,
      value: metric.value,
    });
  }
}
```

**Database Monitoring**:
- Neon dashboard for query performance
- Slow query logs
- Connection pool monitoring
- Table size tracking

**Cost Monitoring**:
- Vercel usage dashboard
- CloudFlare R2 storage costs
- Google Places API calls
- Upstash Redis requests

## Scalability Considerations

### Database Scaling

**Read Replicas**:
```typescript
// Use read replicas for heavy read queries
const readDB = createReadOnlyConnection();

// Write operations use primary
await primaryDB.posts.create(data);

// Read operations use replica
const feed = await readDB.posts.findMany({ ... });
```

**Partitioning Strategy** (Future):
- Partition posts by date (monthly)
- Partition activities by user region
- Archive old data to cold storage

### Caching Tiers

**Level 1 - Redis** (Hot data):
- Active user feeds
- Session data
- Rate limit counters

**Level 2 - CDN** (Static assets):
- Images served via CloudFlare
- Public profile data
- Map tiles

**Level 3 - Browser** (Client cache):
- React Query cache
- Service worker cache (PWA)
- LocalStorage for preferences

### Geographic Distribution

**Current**: Single region deployment

**Future Multi-Region**:
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  US-EAST-1   │     │  EU-WEST-1   │     │  ASIA-SE-1   │
│              │     │              │     │              │
│  App Server  │     │  App Server  │     │  App Server  │
│  Read Replica│     │  Read Replica│     │  Read Replica│
└──────────────┘     └──────────────┘     └──────────────┘
       │                     │                     │
       └─────────────────────┴─────────────────────┘
                             │
                  ┌──────────────────┐
                  │  Primary DB      │
                  │  (US-EAST-1)     │
                  └──────────────────┘
```

## Development Workflow

### Local Development

```bash
# Start development server
npm run dev

# Run database locally
docker-compose up -d postgres redis

# Apply migrations
npm run db:migrate

# Seed data
npm run db:seed

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Branch Strategy

**Branches**:
- `main` - Production (auto-deploy to Vercel)
- `staging` - Pre-production testing
- `develop` - Integration branch
- `feature/*` - Feature branches

**Workflow**:
1. Create feature branch from `develop`
2. Develop and test locally
3. Open PR to `develop`
4. Review and merge
5. Test in staging
6. Merge `develop` → `main` for production

### Testing Strategy

**Unit Tests**:
```typescript
import { describe, it, expect } from 'vitest';

describe('PostService', () => {
  it('should create post with valid data', async () => {
    const post = await postService.create(userId, validData);
    expect(post).toBeDefined();
    expect(post.userId).toBe(userId);
  });
});
```

**Integration Tests**:
```typescript
import { createTestContext } from './helpers';

describe('Post API', () => {
  it('should return user feed', async () => {
    const { caller } = await createTestContext({ user: mockUser });
    const feed = await caller.post.getFeed({ mode: 'local' });
    expect(feed.items).toHaveLength(10);
  });
});
```

**E2E Tests** (Future):
- Playwright for critical user flows
- Post creation flow
- Album creation flow
- Mode switching

## Technology Alternatives Considered

### Frontend Frameworks
- ✅ **Next.js**: Chosen for SSR, SEO, integrated API
- ❌ **Remix**: Considered but less mature ecosystem
- ❌ **Astro**: Great for static, less for dynamic

### Backend Frameworks
- ✅ **tRPC**: Chosen for type safety and DX
- ❌ **GraphQL**: Overkill for this use case
- ❌ **REST**: Less type-safe, more boilerplate

### Databases
- ✅ **PostgreSQL**: Chosen for reliability and PostGIS
- ❌ **MongoDB**: Not ideal for relational data
- ❌ **MySQL**: Considered but PostGIS support weaker

### Map Solutions
- ✅ **mapcn (MapLibre)**: Chosen for cost and customization
- ❌ **Google Maps**: Expensive at scale
- ❌ **Mapbox**: Pricing concerns

---

*End of Architecture Document*
