# Data Models

Complete data model specifications for Viraha.

## Entity Relationship Overview

```
User (1) ──── (many) Post
User (1) ──── (many) Album
User (1) ──── (many) Follow (as follower)
User (1) ──── (many) Follow (as following)
Album (1) ──── (many) Post (via references)
Album (1) ──── (many) JournalEntry
Album (1) ──── (many) Scrapbook (future)
```

## Core Entities

### User

```typescript
interface User {
  id: string;                    // UUID
  username: string;              // Unique, lowercase, 3-30 chars
  displayName: string;           // Display name (can have spaces)
  email: string;                 // Unique, validated
  bio: string;                   // Max 500 chars
  avatar: string;                // URL to avatar image
  
  // Location data
  homeLocation: {
    city: string;
    country: string;
    lat: number;
    lng: number;
    placeId: string;             // Google Places ID
  };
  
  currentLocation?: {
    lat: number;
    lng: number;
    detectedAt: timestamp;
  };
  
  // App state
  mode: 'local' | 'traveling';
  
  // Privacy
  privacy: {
    profileVisibility: 'public' | 'unlisted';
    locationSharing: boolean;
  };
  
  // Metadata
  joinedAt: timestamp;
  updatedAt: timestamp;
  lastActiveAt: timestamp;
}
```

**Indexes**:
- `username` (unique)
- `email` (unique)
- `homeLocation.lat, homeLocation.lng` (geospatial)

**Validation**:
- Username: lowercase, alphanumeric + underscore, 3-30 chars
- Email: valid email format
- Bio: max 500 characters

### Post

```typescript
interface Post {
  id: string;                    // UUID
  userId: string;                // Foreign key to User
  
  // Location (required)
  location: {
    placeId: string;             // Google Places ID
    name: string;                // "Blue Bottle Coffee, San Francisco"
    lat: number;
    lng: number;
    address: string;
    city: string;
    country: string;
  };
  
  // Content
  caption: string;               // Rich text, max 5000 chars
  photos: string[];              // Array of image URLs, 1-4 items
  
  // Metadata
  modeBadge?: 'local' | 'traveling';
  visibility: 'public';          // Future: 'unlisted', 'friends'
  
  // Timestamps
  createdAt: timestamp;
  updatedAt: timestamp;
  
  // Engagement (for algorithm)
  viewCount: number;
  saveCount: number;
}
```

**Indexes**:
- `userId` (for user's posts)
- `location.lat, location.lng` (geospatial queries)
- `location.placeId` (group by place)
- `createdAt` (chronological ordering)

**Validation**:
- Caption: 1-5000 characters
- Photos: 1-4 URLs, valid image formats
- Location: required, validated via Google Places API

**Constraints**:
- Photos array length: min 1, max 4
- Caption required (min 1 char)

### Album

```typescript
interface Album {
  id: string;                    // UUID
  userId: string;                // Foreign key to User
  
  // Basic info
  title: string;                 // Max 200 chars
  description: string;           // Max 2000 chars
  coverImage: string;            // URL to cover image
  
  // Privacy
  privacy: 'public' | 'private';
  
  // References
  postIds: string[];             // Array of Post IDs
  
  // Derived data (computed from posts)
  locations: {
    city: string;
    country: string;
    lat: number;
    lng: number;
  }[];
  
  // Timestamps
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Indexes**:
- `userId` (user's albums)
- `privacy` (for filtering)
- `createdAt` (chronological)

**Validation**:
- Title: 1-200 characters
- Description: max 2000 characters
- PostIds: array of valid Post UUIDs

**Computed Fields**:
- `locations`: Auto-derived from posts in album
- `coverImage`: Defaults to first post's first photo


### JournalEntry

```typescript
interface JournalEntry {
  id: string;                    // UUID
  albumId: string;               // Foreign key to Album
  
  // Content
  content: string;               // Rich text/markdown, max 10000 chars
  
  // Optional location
  location?: {
    name: string;
    lat: number;
    lng: number;
    placeId: string;
  };
  
  // Metadata
  date: timestamp;               // Entry date (can be backdated)
  visibility: 'inherit';         // Inherits from parent album
  
  // Timestamps
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**Indexes**:
- `albumId` (album's entries)
- `date` (chronological within album)

**Validation**:
- Content: 1-10000 characters
- Visibility always inherits from album

### Follow

```typescript
interface Follow {
  id: string;                    // UUID
  followerId: string;            // User who follows
  followingId: string;           // User being followed
  
  createdAt: timestamp;
}
```

**Indexes**:
- `followerId` (who I follow)
- `followingId` (who follows me)
- `followerId, followingId` (unique composite)

**Constraints**:
- Unique pair (followerId, followingId)
- Cannot follow yourself


### Activity (for feed generation)

```typescript
interface Activity {
  id: string;                    // UUID
  userId: string;                // User who created activity
  type: 'post_created' | 'album_created' | 'album_updated';
  targetId: string;              // Post or Album ID
  
  // Optional location data
  location?: {
    lat: number;
    lng: number;
    radius: number;              // For geographic queries
  };
  
  createdAt: timestamp;
}
```

**Indexes**:
- `userId, createdAt` (user timeline)
- `location.lat, location.lng` (geographic feed)
- `type, createdAt` (activity type filtering)
- `createdAt` (chronological)

**Purpose**: Powers both Local and Traveling mode feeds

### Scrapbook (Future MVP)

```typescript
interface Scrapbook {
  id: string;                    // UUID
  albumId: string;               // Foreign key to Album
  
  title: string;                 // Max 200 chars
  
  // Canvas data
  canvas: {
    elements: CanvasElement[];
    width: number;
    height: number;
    backgroundColor: string;
  };
  
  thumbnail: string;             // Generated preview URL
  visibility: 'inherit';         // Inherits from album
  
  createdAt: timestamp;
  updatedAt: timestamp;
}

interface CanvasElement {
  id: string;
  type: 'photo' | 'drawing' | 'text' | 'sticker' | 'shape';
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  rotation: number;              // Degrees
  opacity: number;               // 0-1
  properties: Record<string, any>; // Type-specific props
}
```

**Note**: Scrapbook is complex, deferred to a later phase


## Database Schema (PostgreSQL)

### Table: users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  
  home_city VARCHAR(100),
  home_country VARCHAR(100),
  home_lat DECIMAL(10, 8),
  home_lng DECIMAL(11, 8),
  home_place_id VARCHAR(255),
  
  mode VARCHAR(20) DEFAULT 'local',
  profile_visibility VARCHAR(20) DEFAULT 'public',
  location_sharing BOOLEAN DEFAULT true,
  
  joined_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_location ON users USING GIST(
  ll_to_earth(home_lat, home_lng)
);
```

### Table: posts

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  place_id VARCHAR(255) NOT NULL,
  place_name VARCHAR(500) NOT NULL,
  place_lat DECIMAL(10, 8) NOT NULL,
  place_lng DECIMAL(11, 8) NOT NULL,
  place_address TEXT,
  place_city VARCHAR(100),
  place_country VARCHAR(100),
  
  caption TEXT NOT NULL,
  photos JSONB NOT NULL,
  
  mode_badge VARCHAR(20),
  visibility VARCHAR(20) DEFAULT 'public',
  
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_place ON posts(place_id);
CREATE INDEX idx_posts_location ON posts USING GIST(
  ll_to_earth(place_lat, place_lng)
);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
```


### Table: albums

```sql
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  
  privacy VARCHAR(20) DEFAULT 'public',
  post_ids JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_albums_user ON albums(user_id);
CREATE INDEX idx_albums_privacy ON albums(privacy);
CREATE INDEX idx_albums_created ON albums(created_at DESC);
```

### Table: journal_entries

```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  location_name VARCHAR(500),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_place_id VARCHAR(255),
  
  entry_date TIMESTAMP NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_journal_album ON journal_entries(album_id);
CREATE INDEX idx_journal_date ON journal_entries(entry_date DESC);
```

### Table: follows

```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE UNIQUE INDEX idx_follows_pair ON follows(follower_id, following_id);
```


### Table: activities

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  activity_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_radius INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_location ON activities USING GIST(
  ll_to_earth(location_lat, location_lng)
) WHERE location_lat IS NOT NULL;
CREATE INDEX idx_activities_type ON activities(activity_type, created_at DESC);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
```

## Geospatial Queries

### Find Posts Within Radius

```sql
-- Find posts within 10km of a point
SELECT *
FROM posts
WHERE earth_box(
  ll_to_earth(37.7749, -122.4194), -- center point
  10000 -- radius in meters
) @> ll_to_earth(place_lat, place_lng)
ORDER BY earth_distance(
  ll_to_earth(37.7749, -122.4194),
  ll_to_earth(place_lat, place_lng)
) ASC
LIMIT 50;
```

### Find Users Near Location

```sql
SELECT *
FROM users
WHERE earth_box(
  ll_to_earth(40.7128, -74.0060),
  50000 -- 50km radius
) @> ll_to_earth(home_lat, home_lng)
LIMIT 100;
```

## Data Relationships

```
User
├── Posts (1:many)
├── Albums (1:many)
├── Follows as Follower (1:many)
├── Follows as Following (1:many)
└── Activities (1:many)

Album
├── Posts (many:many via post_ids array)
└── JournalEntries (1:many)

Post
└── Activities (1:many)
```

## Constraints & Validation

### User Constraints
- Username: unique, lowercase, 3-30 chars, alphanumeric + underscore
- Email: unique, valid email format
- Bio: max 500 characters
- Mode: enum ('local', 'traveling')

### Post Constraints
- Caption: required, 1-5000 characters
- Photos: array of 1-4 valid URLs
- Location: required, validated coordinates
- Visibility: enum ('public')

### Album Constraints
- Title: required, 1-200 characters
- Privacy: enum ('public', 'private')
- Post IDs: array of valid Post UUIDs

### Follow Constraints
- Cannot follow yourself
- Unique follower-following pair

---

*End of Data Models Document*
