# Quick Setup Guide

Get Viraha running locally.

## Prerequisites

Install these before starting:

- **Node.js** 20+ ([nodejs.org](https://nodejs.org))
- **PostgreSQL** 15+ ([postgresql.org](https://www.postgresql.org/download/))
- **Redis** 7+ ([redis.io](https://redis.io/docs/getting-started/))
- **Git** ([git-scm.com](https://git-scm.com/))
- **VS Code** or preferred editor

**Accounts Needed**:
- [Mapbox](https://mapbox.com) - Free tier for maps
- [Cloudflare R2](https://cloudflare.com/products/r2/) - Free tier for storage (or use local for dev)

---

## Step 1: Database Setup

### PostgreSQL

```bash
# Create database
createdb viraha_dev

# Enable PostGIS extension
psql viraha_dev
```

```sql
CREATE EXTENSION postgis;
CREATE EXTENSION "uuid-ossp";
\q
```

### Redis

```bash
# Start Redis (macOS with Homebrew)
brew services start redis

# Or run directly
redis-server

# Verify it's running
redis-cli ping
# Should return: PONG
```

---

## Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Configure .env

```bash
# .env file
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://localhost:5432/viraha_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate random strings)
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-also-change-this

# Mapbox
MAPBOX_API_KEY=your-mapbox-token-here

# For local development, these can be set later:
# S3_ENDPOINT=
# S3_BUCKET=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=
```

### Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Optional: Seed with sample data
npm run seed
```

### Start Backend Server

```bash
npm run dev
```

Server runs at: **http://localhost:4000**

Verify it's working:
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok"}
```

---

## Step 3: Frontend Setup

**New terminal window**:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

### Configure .env.local

```bash
# .env.local file
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token-here

# Optional for later:
# NEXT_PUBLIC_GA_ID=
# NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### Start Frontend Server

```bash
npm run dev
```

Frontend runs at: **http://localhost:3000**

Open in browser: [http://localhost:3000](http://localhost:3000)

---

## Step 4: Verify Everything Works

### Test Backend

```bash
# Health check
curl http://localhost:4000/health

# Try to register (should fail with validation error - that's good!)
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test Frontend

1. Open http://localhost:3000
2. You should see the landing page
3. Try clicking "Sign Up" - should show registration form
4. Try creating an account

---

## Step 5: Create Your First Post

### Via Frontend

1. Register a new account
2. Log in
3. Click "Create Post"
4. Upload a photo
5. Add location and caption
6. Post!

### Via API (cURL)

```bash
# 1. Register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser"
  }'

# 2. Login (save the token)
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 3. Create post (replace YOUR_TOKEN)
curl -X POST http://localhost:4000/api/v1/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "caption": "My first post!",
    "mediaUrls": ["https://picsum.photos/800/600"],
    "location": {
      "lat": 40.7128,
      "lng": -74.0060,
      "name": "New York City"
    },
    "privacy": "public"
  }'
```

---

## Common Issues & Solutions

### Port Already in Use

**Backend (Port 4000)**:
```bash
# Find process using port 4000
lsof -i :4000

# Kill it
kill -9 <PID>

# Or use different port in .env
PORT=4001
```

**Frontend (Port 3000)**:
```bash
# Next.js will auto-increment to 3001 if 3000 is busy
# Or specify custom port:
PORT=3001 npm run dev
```

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# If not running (macOS):
brew services start postgresql@15

# Verify database exists
psql -l | grep viraha_dev

# If missing, create it:
createdb viraha_dev
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping

# If not running (macOS):
brew services start redis

# Or run manually:
redis-server
```

### Prisma Client Not Generated

```bash
cd backend
npx prisma generate
```

### Migration Errors

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name fix_something
```

### Module Not Found

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

---

## Development Workflow

### Making Changes

**Backend**:
1. Edit code in `backend/src/`
2. Server auto-restarts (nodemon)
3. Test changes at `http://localhost:4000`

**Frontend**:
1. Edit code in `frontend/app/` or `frontend/components/`
2. Hot reload updates browser
3. View changes at `http://localhost:3000`

**Database**:
1. Edit `backend/prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name your_change`
3. Prisma client regenerates automatically

### Viewing Data

**Database (Prisma Studio)**:
```bash
cd backend
npx prisma studio
```
Opens at: http://localhost:5555

**Redis (Redis CLI)**:
```bash
redis-cli
> KEYS *
> GET key_name
```

---

## Useful Commands

### Backend

```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm start           # Start production server
npm test            # Run tests
npm run lint        # Lint code
npm run format      # Format code

# Prisma
npx prisma studio   # Open database GUI
npx prisma format   # Format schema
npx prisma validate # Validate schema
```

### Frontend

```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Lint code
npm run type-check  # TypeScript check
```

---

## Next Steps

Once everything is running:

1. **Explore the codebase**:
   - Backend: Start with `backend/src/server.ts`
   - Frontend: Start with `frontend/app/page.tsx`

2. **Read the docs**:
   - [Product Vision](./01-product-vision.md)
   - [Core Features](./02-core-features.md)
   - [System Architecture](./05-system-architecture.md)

3. **Try the API**:
   - Import Postman collection (when available)
   - Test all endpoints
   - Understand data flow

4. **Build a feature**:
   - Pick from MVP roadmap
   - Create a branch
   - Implement and test
   - Submit PR (future)

---

## Getting Help

**Documentation**: Check `/docs` folder  
**Common Issues**: See above section  
**Questions**: [Create an issue] (when repo available)

**Stuck?** Don't hesitate to:
1. Check the logs (`backend/logs/` or terminal output)
2. Review related documentation
3. Search existing issues
4. Ask for help

---

## Clean Up

To stop everything:

```bash
# Stop backend: Ctrl+C in backend terminal

# Stop frontend: Ctrl+C in frontend terminal

# Stop services (macOS):
brew services stop postgresql@15
brew services stop redis

# Or if running manually, just Ctrl+C
```

To reset and start fresh:

```bash
# Backend
cd backend
rm -rf node_modules
npx prisma migrate reset
npm install
npm run dev

# Frontend  
cd frontend
rm -rf node_modules .next
npm install
npm run dev
```

---

**You're ready to build Viraha! 🚀**
