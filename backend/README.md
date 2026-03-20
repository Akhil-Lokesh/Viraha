# Viraha Backend

Node.js/Express API server for Viraha travel memory platform.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+ with PostGIS
- **ORM**: Prisma
- **Cache**: Redis 7+
- **Auth**: JWT (jsonwebtoken)
- **Validation**: Zod
- **File Upload**: Multer + S3
- **Testing**: Jest + Supertest

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validator.ts
│   ├── routes/           # API routes
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   ├── albums.ts
│   │   ├── journals.ts
│   │   ├── feed.ts
│   │   ├── social.ts
│   │   └── media.ts
│   ├── controllers/      # Route handlers
│   │   ├── authController.ts
│   │   ├── postController.ts
│   │   ├── albumController.ts
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── AuthService.ts
│   │   ├── PostService.ts
│   │   ├── AlbumService.ts
│   │   ├── FeedService.ts
│   │   ├── GeoService.ts
│   │   ├── MediaService.ts
│   │   └── SearchService.ts
│   ├── models/           # Database models (Prisma)
│   │   └── schema.prisma
│   ├── utils/            # Utility functions
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── imageProcessor.ts
│   │   └── validators.ts
│   ├── types/            # TypeScript types
│   │   ├── express.d.ts
│   │   └── models.ts
│   └── server.ts         # Express app setup
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

Create a `.env` file:

```bash
# Application
NODE_ENV=development
PORT=4000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/viraha
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL_DEFAULT=900  # 15 minutes

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# S3/R2 Storage
S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com
S3_BUCKET=viraha-media
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=auto

# External Services
MAPBOX_API_KEY=your-mapbox-key
ALGOLIA_APP_ID=your-algolia-app-id
ALGOLIA_API_KEY=your-algolia-admin-key

# Email (future)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-key

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000  # 1 minute
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

```bash
# Clone and navigate
cd backend

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

## Available Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm start            # Start production server
npm run migrate      # Run database migrations
npm run seed         # Seed database
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint code
npm run format       # Format code with Prettier
```

## API Endpoints

### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Users
```
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/:id/posts
GET    /api/v1/users/:id/albums
```

### Posts
```
GET    /api/v1/posts
GET    /api/v1/posts/:id
POST   /api/v1/posts
PATCH  /api/v1/posts/:id
DELETE /api/v1/posts/:id
GET    /api/v1/posts/nearby?lat=&lng=&radius=
```

### Albums
```
GET    /api/v1/albums
GET    /api/v1/albums/:id
POST   /api/v1/albums
PATCH  /api/v1/albums/:id
DELETE /api/v1/albums/:id
POST   /api/v1/albums/:id/posts
DELETE /api/v1/albums/:id/posts/:postId
```

### Journals
```
GET    /api/v1/journals
GET    /api/v1/journals/:id
POST   /api/v1/journals
PATCH  /api/v1/journals/:id
DELETE /api/v1/journals/:id
GET    /api/v1/journals/:id/entries
POST   /api/v1/journals/:id/entries
PATCH  /api/v1/journals/:id/entries/:entryId
DELETE /api/v1/journals/:id/entries/:entryId
```

### Feed
```
GET    /api/v1/feed
GET    /api/v1/feed/discover
GET    /api/v1/feed/following
```

### Social
```
POST   /api/v1/social/follow/:userId
DELETE /api/v1/social/unfollow/:userId
GET    /api/v1/social/followers
GET    /api/v1/social/following
POST   /api/v1/posts/:id/comments
GET    /api/v1/posts/:id/comments
DELETE /api/v1/comments/:id
```

### Media
```
POST   /api/v1/media/upload
POST   /api/v1/media/process
```

### Search
```
GET    /api/v1/search/posts?q=&location=&radius=
GET    /api/v1/search/users?q=
GET    /api/v1/search/locations?q=
```

## Core Services

### AuthService

```typescript
class AuthService {
  async register(data: RegisterData): Promise<AuthResponse>
  async login(email: string, password: string): Promise<AuthResponse>
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }>
  async logout(userId: string, refreshToken: string): Promise<void>
  async verifyToken(token: string): Promise<JWTPayload>
}
```

### PostService

```typescript
class PostService {
  async create(userId: string, data: CreatePostData): Promise<Post>
  async findById(postId: string, userId?: string): Promise<Post | null>
  async findMany(filters: PostFilters, userId?: string): Promise<Post[]>
  async update(postId: string, userId: string, data: UpdatePostData): Promise<Post>
  async delete(postId: string, userId: string): Promise<void>
  async findNearby(lat: number, lng: number, radius: number): Promise<Post[]>
}
```

### FeedService

```typescript
class FeedService {
  async generateFeed(userId: string, page: number): Promise<FeedItem[]>
  async getDiscoverFeed(userId: string, page: number): Promise<FeedItem[]>
  async getFollowingFeed(userId: string, page: number): Promise<FeedItem[]>
  async refreshFeedCache(userId: string): Promise<void>
}
```

### GeoService

```typescript
class GeoService {
  async reverseGeocode(lat: number, lng: number): Promise<LocationInfo>
  async searchPlaces(query: string): Promise<Place[]>
  async calculateDistance(point1: Coordinates, point2: Coordinates): Promise<number>
  async isInHomeRadius(userId: string, currentLocation: Coordinates): Promise<boolean>
}
```

### MediaService

```typescript
class MediaService {
  async getUploadURL(filename: string, contentType: string): Promise<UploadURL>
  async processImage(imageUrl: string): Promise<ProcessedImage>
  async generateThumbnails(imageUrl: string): Promise<string[]>
  async deleteMedia(mediaUrl: string): Promise<void>
}
```

## Middleware

### Authentication Middleware

```typescript
// middleware/auth.ts
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const payload = await AuthService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Rate Limiting

```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

export const apiLimiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
});
```

### Validation Middleware

```typescript
// middleware/validator.ts
import { z } from 'zod';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};
```

## Database

### Prisma Schema

See `prisma/schema.prisma` for complete database schema.

### Migrations

```bash
# Create a new migration
npx prisma migrate dev --name add_posts_table

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Seeding

```bash
# Run seed script
npm run seed
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- posts.test.ts

# Watch mode
npm run test:watch
```

### Test Structure

```typescript
// tests/integration/posts.test.ts
describe('Posts API', () => {
  describe('POST /api/v1/posts', () => {
    it('should create a new post', async () => {
      const response = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          caption: 'Test post',
          mediaUrls: ['https://example.com/image.jpg'],
          location: { lat: 40.7128, lng: -74.0060 },
          privacy: 'public',
        });
        
      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
    });
  });
});
```

## Performance

### Caching Strategy

```typescript
// utils/cache.ts
export class CacheManager {
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttl: number = 900): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

### Query Optimization

```typescript
// Eager loading to prevent N+1
const posts = await prisma.post.findMany({
  include: {
    user: {
      select: { id: true, username: true, avatar: true },
    },
    _count: {
      select: { comments: true, saves: true },
    },
  },
  where: { privacy: 'public' },
  orderBy: { takenAt: 'desc' },
  take: 20,
  skip: page * 20,
});
```

## Security

### Input Sanitization

```typescript
import { sanitize } from './utils/sanitize';

const createPost = async (req: Request, res: Response) => {
  const { caption, ...rest } = req.body;
  const sanitizedCaption = sanitize(caption);
  // ... create post
};
```

### SQL Injection Prevention

- Use Prisma ORM (parameterized queries)
- Never use raw SQL with user input
- Validate all inputs with Zod

### XSS Prevention

- Sanitize user-generated content
- Set appropriate CSP headers
- Escape output when rendering

## Deployment

### Build for Production

```bash
npm run build
```

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Health Check Endpoint

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-14T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "connected"
  }
}
```

## Monitoring

### Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Error Tracking

Integrate Sentry for production error tracking:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Contributing

See main project README for contribution guidelines.

## License

TBD
