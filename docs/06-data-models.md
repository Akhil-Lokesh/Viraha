# Data Models

Complete TypeScript/PostgreSQL data models for Viraha.

## Core Entities

### User

```typescript
interface User {
  id: string;                    // UUID
  username: string;               // Unique, 3-30 chars
  email: string;                  // Unique, validated
  passwordHash: string;           // bcrypt
  
  // Profile
  displayName: string;            // Full name or nickname
  bio?: string;                   // Max 500 chars
  avatar?: string;                // URL to profile image
  coverImage?: string;            // URL to cover photo
  
  // Location
  homeLocation?: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  currentLocation?: {             // Updated by GPS
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  
  // Settings
  isPrivate: boolean;             // Profile visibility
  defaultPostPrivacy: 'private' | 'followers' | 'public';
  travelModeEnabled: boolean;     // Auto or manual mode
  travelModeRadius: number;       // Miles from home to trigger
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  emailVerified: boolean;
  isActive: boolean;
}
```

**PostgreSQL Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  display_name VARCHAR(100),
  bio TEXT,
  avatar TEXT,
  cover_image TEXT,
  
  home_location GEOGRAPHY(POINT),
  home_city VARCHAR(100),
  home_country VARCHAR(100),
  current_location GEOGRAPHY(POINT),
  current_location_updated_at TIMESTAMPTZ,
  
  is_private BOOLEAN DEFAULT true,
  default_post_privacy VARCHAR(20) DEFAULT 'followers',
  travel_mode_enabled BOOLEAN DEFAULT true,
  travel_mode_radius INTEGER DEFAULT 50,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_home_location ON users USING GIST(home_location);
```

---

### Post

```typescript
interface Post {
  id: string;                     // UUID
  userId: string;                 // Author
  
  // Content
  caption?: string;               // Max 2000 chars
  mediaUrls: string[];            // 1-10 photos/videos
  mediaThumbnails: string[];      // Compressed versions
  
  // Location
  location: {
    lat: number;
    lng: number;
    name?: string;                // Place name
    city?: string;
    country?: string;
    placeId?: string;             // Google Places ID
  };
  
  // Metadata
  takenAt: Date;                  // When photo was taken
  postedAt: Date;                 // When posted to Viraha
  privacy: 'private' | 'followers' | 'public';
  tags: string[];
  
  // Engagement
  commentCount: number;
  saveCount: number;
  
  // Organization
  albumId?: string;               // If part of album
  journalEntryId?: string;        // If part of journal
  
  // Status
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**PostgreSQL Schema**:
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  caption TEXT,
  media_urls TEXT[] NOT NULL,
  media_thumbnails TEXT[],
  
  location GEOGRAPHY(POINT) NOT NULL,
  location_name VARCHAR(255),
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  place_id VARCHAR(255),
  
  taken_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  privacy VARCHAR(20) NOT NULL,
  tags TEXT[],
  
  comment_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_location ON posts USING GIST(location);
CREATE INDEX idx_posts_taken_at ON posts(taken_at);
CREATE INDEX idx_posts_privacy ON posts(privacy);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
```

---

### Album

```typescript
interface Album {
  id: string;
  userId: string;
  
  // Content
  title: string;
  description?: string;
  coverPhotoUrl: string;          // Selected from album or manual
  
  // Location (can span multiple)
  locations: {
    lat: number;
    lng: number;
    name?: string;
    city?: string;
    country?: string;
  }[];
  primaryLocation: {              // Main location for filtering
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
  
  // Dates
  startDate: Date;
  endDate: Date;
  
  // Metadata
  privacy: 'private' | 'followers' | 'public';
  postIds: string[];              // Ordered list of posts
  photoCount: number;
  
  // Engagement
  viewCount: number;
  saveCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}
```

**PostgreSQL Schema**:
```sql
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_photo_url TEXT NOT NULL,
  
  primary_location GEOGRAPHY(POINT) NOT NULL,
  primary_city VARCHAR(100),
  primary_country VARCHAR(100),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  privacy VARCHAR(20) NOT NULL,
  photo_count INTEGER DEFAULT 0,
  
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE album_posts (
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (album_id, post_id)
);

CREATE INDEX idx_albums_user_id ON albums(user_id);
CREATE INDEX idx_albums_location ON albums USING GIST(primary_location);
CREATE INDEX idx_albums_dates ON albums(start_date, end_date);
```

---

### Journal

```typescript
interface Journal {
  id: string;
  userId: string;
  
  // Content
  title: string;
  summary?: string;               // Trip overview
  coverImage?: string;
  
  // Trip Details
  startDate: Date;
  endDate: Date;
  
  // Location
  locations: {                    // All places visited
    lat: number;
    lng: number;
    name: string;
    arrivalDate: Date;
  }[];
  primaryLocation: {              // Starting point or main destination
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  
  // Metadata
  privacy: 'private' | 'followers' | 'public';
  entryCount: number;
  wordCount: number;
  
  // Engagement
  viewCount: number;
  
  // Status
  isDraft: boolean;
  publishedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface JournalEntry {
  id: string;
  journalId: string;
  userId: string;
  
  // Content
  date: Date;                     // Which day of the trip
  content: string;                // Markdown
  mood?: 'amazing' | 'good' | 'okay' | 'challenging';
  
  // Location
  location?: {
    lat: number;
    lng: number;
    name?: string;
  };
  weather?: {
    condition: string;
    temp: number;
    unit: 'C' | 'F';
  };
  
  // Media
  mediaUrls: string[];
  
  // Organization
  position: number;               // Order in journal
  
  createdAt: Date;
  updatedAt: Date;
}
```

**PostgreSQL Schema**:
```sql
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  cover_image TEXT,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  primary_location GEOGRAPHY(POINT) NOT NULL,
  primary_city VARCHAR(100),
  primary_country VARCHAR(100),
  
  privacy VARCHAR(20) NOT NULL,
  entry_count INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  
  view_count INTEGER DEFAULT 0,
  
  is_draft BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  content TEXT NOT NULL,
  mood VARCHAR(20),
  
  location GEOGRAPHY(POINT),
  location_name VARCHAR(255),
  weather_condition VARCHAR(50),
  weather_temp NUMERIC(4,1),
  weather_unit VARCHAR(1),
  
  media_urls TEXT[],
  
  position INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(journal_id, date)
);

CREATE INDEX idx_journals_user_id ON journals(user_id);
CREATE INDEX idx_journals_location ON journals USING GIST(primary_location);
CREATE INDEX idx_journal_entries_journal_id ON journal_entries(journal_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(date);
```

---

### Follow

```typescript
interface Follow {
  id: string;
  followerId: string;             // Person doing the following
  followingId: string;            // Person being followed
  
  // Preferences
  notifications: boolean;         // Get notified of new posts
  showInFeed: boolean;           // Include in main feed
  
  createdAt: Date;
}
```

**PostgreSQL Schema**:
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  notifications BOOLEAN DEFAULT true,
  show_in_feed BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

---

### Scrapbook (Saved Content)

```typescript
interface ScrapbookItem {
  id: string;
  userId: string;
  
  // Content Reference
  contentType: 'post' | 'album' | 'journal' | 'external';
  contentId?: string;             // If internal content
  externalUrl?: string;           // If external link
  externalTitle?: string;
  externalDescription?: string;
  externalImage?: string;
  
  // Organization
  folder?: string;                // User-defined folder
  tags: string[];
  notes?: string;                 // Personal notes about this save
  
  // Metadata
  savedAt: Date;
  position: number;               // Order in scrapbook
}
```

**PostgreSQL Schema**:
```sql
CREATE TABLE scrapbook_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  content_type VARCHAR(20) NOT NULL,
  content_id UUID,
  external_url TEXT,
  external_title VARCHAR(255),
  external_description TEXT,
  external_image TEXT,
  
  folder VARCHAR(100),
  tags TEXT[],
  notes TEXT,
  
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  position INTEGER NOT NULL
);

CREATE INDEX idx_scrapbook_user_id ON scrapbook_items(user_id);
CREATE INDEX idx_scrapbook_folder ON scrapbook_items(user_id, folder);
CREATE INDEX idx_scrapbook_tags ON scrapbook_items USING GIN(tags);
```

---

### Comment

```typescript
interface Comment {
  id: string;
  userId: string;
  
  // Target
  contentType: 'post' | 'album' | 'journal';
  contentId: string;
  
  // Content
  text: string;                   // Max 1000 chars
  
  // Threading
  parentCommentId?: string;       // For replies
  
  // Metadata
  isEdited: boolean;
  isDeleted: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}
```

**PostgreSQL Schema**:
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  content_type VARCHAR(20) NOT NULL,
  content_id UUID NOT NULL,
  
  text TEXT NOT NULL,
  
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_content ON comments(content_type, content_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
```

---

### Activity (Feed)

```typescript
interface Activity {
  id: string;
  userId: string;                 // Who will see this in their feed
  actorId: string;                // Who performed the action
  
  // Activity Details
  type: 'post' | 'album' | 'journal' | 'follow' | 'comment' | 'save';
  contentType?: 'post' | 'album' | 'journal';
  contentId?: string;
  
  // Metadata
  createdAt: Date;
  isRead: boolean;
}
```

**PostgreSQL Schema**:
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(20) NOT NULL,
  content_type VARCHAR(20),
  content_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

CREATE INDEX idx_activities_user_id ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_unread ON activities(user_id, is_read);
```

---

## Relationships Summary

```
User
├── Has many Posts
├── Has many Albums
├── Has many Journals
├── Has many ScrapbookItems
├── Has many Comments
├── Follows many Users (as follower)
└── Followed by many Users (as following)

Post
├── Belongs to User
├── May belong to Album
├── May belong to JournalEntry
└── Has many Comments

Album
├── Belongs to User
├── Has many Posts (through album_posts)
└── Has many Comments

Journal
├── Belongs to User
├── Has many JournalEntries
└── Has many Comments

JournalEntry
├── Belongs to Journal
├── Belongs to User
└── May reference Posts
```

---

## Indexes & Performance

**Critical Geospatial Indexes**:
```sql
-- PostGIS extension required
CREATE EXTENSION IF NOT EXISTS postgis;

-- Spatial indexes for location-based queries
CREATE INDEX idx_posts_location_gist ON posts USING GIST(location);
CREATE INDEX idx_albums_location_gist ON albums USING GIST(primary_location);
CREATE INDEX idx_users_home_location_gist ON users USING GIST(home_location);
```

**Performance Indexes**:
```sql
-- Feed queries
CREATE INDEX idx_posts_user_privacy_date ON posts(user_id, privacy, taken_at DESC);
CREATE INDEX idx_activities_feed ON activities(user_id, created_at DESC) WHERE is_read = false;

-- Search
CREATE INDEX idx_posts_tags_gin ON posts USING GIN(tags);
CREATE INDEX idx_scrapbook_tags_gin ON scrapbook_items USING GIN(tags);

-- User lookups
CREATE INDEX idx_users_username_lower ON users(LOWER(username));
```

---

## Data Validation Rules

**User**:
- Username: 3-30 chars, alphanumeric + underscore
- Email: Valid email format
- Bio: Max 500 chars
- Home location: Valid coordinates

**Post**:
- Caption: Max 2000 chars
- Media: 1-10 files
- Location: Required, valid coordinates
- Tags: Max 20 tags, each max 30 chars

**Album**:
- Title: 1-255 chars, required
- Posts: Min 5, max 100
- Date range: endDate >= startDate

**Journal**:
- Title: 1-255 chars, required
- Entries: Date must be within start/end range
- Content: Markdown, max 50,000 chars per entry

**Comment**:
- Text: 1-1000 chars
- Cannot comment on deleted content
- Cannot reply to deleted comments
