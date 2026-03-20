# Viraha - Project Overview

> **Viraha** (विरह) - *The ache of separation from what you love*

## Quick Start

**What is Viraha?**
A travel memory platform that combines beautiful photo collections, personal journals, and location-based memories on an interactive map. Think Letterboxd for travel.

**Current Status**: Planning & Documentation Phase

## Documentation Index

### Getting Started
1. [Main README](../README.md) - Project overview and structure
2. [Product Vision](./01-product-vision.md) - Why we're building this
3. [Core Features](./02-core-features.md) - What we're building
4. [MVP Roadmap](./18-mvp-roadmap.md) - Development roadmap

### Technical Documentation
- [System Architecture](./05-system-architecture.md) - High-level technical design
- [Data Models](./06-data-models.md) - Database schemas
- [Backend Guide](../backend/README.md) - API server documentation
- [Frontend Guide](../frontend/README.md) - Web app documentation

### Design & Brand
- [Naming Research](./24-naming-research.md) - Brand name journey
- [User Experience](./03-user-experience.md) - UX principles
- [Dual Mode System](./04-dual-mode-system.md) - Local vs Traveling modes

## Core Concepts

### The Philosophy

**Memory Over Metrics**: We reject ratings, follower counts, and algorithmic manipulation. Viraha is about personal preservation, not social performance.

**No Ratings System**: Travel is subjective and personal. We don't believe in scoring experiences or creating "best of" lists that homogenize travel.

**Privacy-First**: Everything defaults to private. Share what you want, keep what matters to you alone.

### Content Types

1. **Posts** - Quick moments with photos (1-10 images + caption + location)
2. **Albums** - Curated photo collections from a trip or theme
3. **Journals** - Day-by-day travel narratives with rich text
4. **Scrapbook** - Private collection of saved inspiration

### Dual Mode System

**Local Mode** (Default):
- Browse and organize existing content
- Explore feed and discovery
- Plan future trips
- Reflect on past journeys

**Traveling Mode** (GPS-Activated):
- Quick content capture
- Minimal friction posting
- Offline-first functionality
- Battery-conscious design

### Map Integration (MAPCN)

The map is not just a feature - it's the **primary canvas** for your travel story.

- Interactive world map with memory pins
- Timeline scrubber to see journey progression
- Context-aware clustering
- Discover content by location

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI**: React + shadcn/ui components
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS
- **State**: Zustand + React Query

### Backend
- **Runtime**: Node.js 20+ with Express
- **Language**: TypeScript
- **Database**: PostgreSQL 15+ with PostGIS
- **Cache**: Redis 7+
- **Storage**: Cloudflare R2 (S3-compatible)
- **Search**: Algolia or Elasticsearch

### Infrastructure
- **Hosting** (MVP): Vercel (frontend), Railway (backend)
- **Database**: Neon or Supabase
- **CDN**: Cloudflare
- **Monitoring**: Sentry + Better Stack

## Project Structure

```
viraha/
├── backend/           # Node.js/Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── models/
│   ├── tests/
│   └── README.md
├── frontend/          # Next.js web app
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── README.md
└── docs/             # Comprehensive documentation
    ├── 01-product-vision.md
    ├── 02-core-features.md
    ├── 05-system-architecture.md
    ├── 06-data-models.md
    ├── 18-mvp-roadmap.md
    ├── 24-naming-research.md
    └── README.md
```

## MVP Roadmap

### Phase 1: Foundation
✅ User authentication  
✅ Post creation with photos  
✅ Interactive map view  
✅ Basic feed  

### Phase 2: Rich Content
- Album creation and management
- Journal entries with markdown
- Enhanced map features
- Following system

### Phase 3: Discovery
- Personalized feed algorithm
- Search and discovery
- Scrapbook functionality
- Social interactions

### Phase 4: Polish
- Mobile app (React Native)
- Advanced privacy controls
- Performance optimization
- Analytics and insights

## Key Differentiators

| vs | Viraha Difference |
|----|-------------------|
| **Instagram** | Memory preservation over social validation, no algorithm manipulation, privacy-first |
| **Google Photos** | Location and story context, discovery from others, structured by place and time |
| **TripAdvisor** | Personal experience over consumer reviews, no pressure to rate, narrative focus |
| **Travel Blogs** | Low-friction capture, photo-first design, mobile-optimized |

## Success Metrics

### MVP Success
- 10,000+ registered users
- 50,000+ posts created
- Strong user retention
- 4.5+ app rating
- Strong organic growth

### Key KPIs
- **Engagement**: Posts per active user per month
- **Retention**: User return rates
- **Quality**: Average session duration
- **Growth**: Organic signup rate
- **Technical**: API response time, uptime

## Brand Identity

**Name**: Viraha (विरह)  
**Meaning**: Sanskrit for "the ache of separation from what you love"

**Tagline**: "Keep your travels alive"

**Visual Language**:
- Warm, earthy tones with sunset gradients
- Clean, minimalist interfaces
- Focus on photography and memories
- Subtle, meaningful animations

**Voice**:
- Poetic but not pretentious
- Warm and inviting
- Respectful of cultural depth
- Honest and authentic

## Design Principles

1. **Memory Over Metrics** - No ratings, no competition
2. **Beautiful by Default** - Every view inspires wanderlust
3. **Friction-Free Capture** - Document without disrupting
4. **Respect Privacy** - Users control their story
5. **Community Discovery** - Find inspiration through trust

## Development Setup

### Quick Start

```bash
# Clone repository (when available)
git clone https://github.com/yourusername/viraha.git
cd viraha

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your config
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your config
npm run dev
```

**Backend**: http://localhost:4000  
**Frontend**: http://localhost:3000

### Required Services

**Development**:
- PostgreSQL 15+
- Redis 7+
- Mapbox account (free tier)

**Production** (add later):
- Cloudflare R2 or S3
- Algolia or Elasticsearch
- Email service (SendGrid, etc.)

## Contributing

### Solo Development
Currently in planning and early development phase. Focus on:
1. Finalizing documentation
2. Setting up infrastructure
3. Building core features
4. Testing with small user group

### Future: Open Collaboration
Once MVP is stable:
- Contribution guidelines
- Code of conduct
- Issue templates
- PR process

## What's Next

### Immediate Next Steps
- [ ] Verify domain availability (viraha.app)
- [ ] Set up project repositories
- [ ] Initialize backend and frontend projects
- [ ] Configure development environment
- [ ] Design database schema
- [ ] Create initial API endpoints

### Near-term Goals
- [ ] Complete Phase 1 of MVP
- [ ] Deploy to staging environment
- [ ] Recruit beta testers
- [ ] Gather initial feedback
- [ ] Iterate on core features

### Longer-term Goals
- [ ] Complete MVP (Phases 2-4)
- [ ] Public beta launch
- [ ] Mobile app development
- [ ] Performance optimization
- [ ] Scale infrastructure

## Resources

### Documentation
- [Notion Workspace](https://notion.so/viraha) (when available)
- [Figma Designs](https://figma.com/viraha) (when available)
- [Project Board](https://github.com/project/board) (when available)

### External References
- [Letterboxd](https://letterboxd.com) - Inspiration
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Next.js App Router](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)

## Contact & Support

**Project Lead**: [Your Name]  
**Email**: [your email]  
**Repository**: [GitHub URL]  

## License

TBD

---

## Vision Statement

> "Viraha exists to honor the depth of travel experiences. We believe every journey leaves an ember - a glowing warmth that can fade with time. Our mission is to help you tend that ember, keeping it alive so you can return to the feeling of those places, those moments, whenever you need them.
> 
> We reject the metrics and manipulation that plague social platforms. We don't believe in rating sunsets or scoring mountains. Instead, we create a space where your travels can live as they truly are: personal, meaningful, and entirely yours.
> 
> Travel changes us. Viraha helps us remember how."

---

**Status**: Planning & Documentation Phase
**Version**: 0.1.0-alpha
