# API Specification

**Viraha Backend API** - tRPC Routes Documentation

---

## Overview

The Viraha API is built with tRPC, providing end-to-end type safety between the frontend and backend.

**Base URL**: `/api/trpc`

**Authentication**: Bearer token via Clerk (automatically handled by tRPC context)

## API Structure

```
api/trpc/
├── routers/
│   ├── auth.ts         # Authentication & user management
│   ├── post.ts         # Post CRUD operations
│   ├── album.ts        # Album management
│   ├── feed.ts         # Feed generation
│   ├── user.ts         # User profiles
│   ├── follow.ts       # Follow/unfollow operations
│   ├── geo.ts          # Geographic queries
│   └── activity.ts     # Activity tracking
├── root.ts             # Root router
└── context.ts          # Request context
```

## Authentication

### Register User

Creates new user account via Clerk.

**Handled by Clerk** - Not a custom endpoint

```typescript
// Client-side only
import { useSignUp } from '@clerk/nextjs';
const { signUp } = useSignUp();
```

### Get Current User

```typescript
auth.me.useQuery()
```

**Returns**:
```typescript
{
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio: string;
  avatar: string;
  homeLocation: Location;
  mode: 'local' | 'traveling';
  privacy: PrivacySettings;
}
```

### Update Profile

```typescript
auth.updateProfile.useMutation()
```

**Input**:
```typescript
{
  displayName?: string;
  bio?: string;
  avatar?: string;
  homeLocation?: {
    city: string;
    country: string;
    placeId: string;
  };
  privacy?: PrivacySettings;
}
```

**Returns**: Updated `User` object


## Posts

### Create Post

```typescript
post.create.useMutation()
```

**Input**:
```typescript
{
  placeId: string;           // Google Places ID
  caption: string;           // 1-5000 chars
  photos: string[];          // 1-4 image URLs (after upload)
  modeBadge?: 'local' | 'traveling';
}
```

**Process**:
1. Validate place via Google Places API
2. Create post in database
3. Create activity entry
4. Invalidate feed cache
5. Return created post

**Returns**:
```typescript
{
  id: string;
  userId: string;
  location: {
    placeId: string;
    name: string;
    lat: number;
    lng: number;
    address: string;
    city: string;
    country: string;
  };
  caption: string;
  photos: string[];
  modeBadge?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Get Post by ID

```typescript
post.getById.useQuery({ id: string })
```

**Returns**: `Post` object or null

### Update Post

```typescript
post.update.useMutation()
```

**Input**:
```typescript
{
  id: string;
  caption?: string;
  photos?: string[];
}
```

**Note**: Cannot change location after creation

**Returns**: Updated `Post` object

### Delete Post

```typescript
post.delete.useMutation()
```

**Input**:
```typescript
{
  id: string;
}
```

**Process**:
1. Verify ownership
2. Remove from albums
3. Delete activities
4. Delete from database
5. Delete photos from R2
6. Invalidate caches

**Returns**: `{ success: true }`

### Get User Posts

```typescript
post.getByUser.useQuery({
  userId: string;
  cursor?: string;
  limit?: number; // default: 20
})
```

**Returns**:
```typescript
{
  items: Post[];
  nextCursor?: string;
}
```

### Upload Photos

```typescript
post.uploadPhotos.useMutation()
```

**Input**:
```typescript
{
  photos: File[]; // 1-4 files
}
```

**Process**:
1. Validate file types (JPEG, PNG, WebP)
2. Compress and optimize images
3. Generate thumbnails
4. Upload to R2
5. Return URLs

**Returns**:
```typescript
{
  urls: string[];    // Full-size image URLs
  thumbs: string[];  // Thumbnail URLs
}
```


## Albums

### Create Album

```typescript
album.create.useMutation()
```

**Input**:
```typescript
{
  title: string;         // 1-200 chars
  description?: string;  // max 2000 chars
  privacy: 'public' | 'private';
  postIds?: string[];    // Initial posts
}
```

**Returns**: Created `Album` object

### Get Album by ID

```typescript
album.getById.useQuery({
  id: string;
})
```

**Returns**:
```typescript
{
  id: string;
  userId: string;
  title: string;
  description: string;
  coverImage: string;
  privacy: 'public' | 'private';
  posts: Post[];           // Hydrated posts
  journals: JournalEntry[]; // Journal entries
  locations: Location[];    // Derived from posts
  createdAt: Date;
  updatedAt: Date;
}
```

### Update Album

```typescript
album.update.useMutation()
```

**Input**:
```typescript
{
  id: string;
  title?: string;
  description?: string;
  privacy?: 'public' | 'private';
  coverImage?: string;
}
```

**Returns**: Updated `Album` object

### Add Posts to Album

```typescript
album.addPosts.useMutation()
```

**Input**:
```typescript
{
  albumId: string;
  postIds: string[];
}
```

**Returns**: Updated `Album` object

### Remove Posts from Album

```typescript
album.removePosts.useMutation()
```

**Input**:
```typescript
{
  albumId: string;
  postIds: string[];
}
```

**Returns**: Updated `Album` object

### Get User Albums

```typescript
album.getByUser.useQuery({
  userId: string;
  includePrivate?: boolean; // Only if viewing own profile
})
```

**Returns**:
```typescript
{
  albums: Album[];
}
```

### Delete Album

```typescript
album.delete.useMutation()
```

**Input**:
```typescript
{
  id: string;
}
```

**Note**: Does not delete posts, only removes album container

**Returns**: `{ success: true }`


## Feed

### Get Feed

```typescript
feed.get.useQuery({
  mode: 'local' | 'traveling';
  cursor?: string;
  limit?: number; // default: 20
  location?: {
    lat: number;
    lng: number;
  };
})
```

**Local Mode** (mode: 'local'):
- Returns posts from followed users
- Personalized based on interactions
- No location required

**Traveling Mode** (mode: 'traveling'):
- Returns posts from current location
- Requires location parameter
- Boosts posts from followed users
- Geographic radius: 50km

**Returns**:
```typescript
{
  items: FeedItem[];
  nextCursor?: string;
}

type FeedItem = {
  type: 'post' | 'album';
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  content: Post | Album;
  createdAt: Date;
  isFollowing: boolean;
  isSaved: boolean;
};
```

## Users

### Get User Profile

```typescript
user.getById.useQuery({
  userId: string;
})
```

**Returns**:
```typescript
{
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  homeLocation: {
    city: string;
    country: string;
  };
  stats: {
    postsCount: number;
    albumsCount: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;  // If current user follows this user
  joinedAt: Date;
}
```

### Search Users

```typescript
user.search.useQuery({
  query: string;
  limit?: number; // default: 20
})
```

**Returns**:
```typescript
{
  users: UserSearchResult[];
}

type UserSearchResult = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followersCount: number;
  isFollowing: boolean;
};
```


## Follow

### Follow User

```typescript
follow.follow.useMutation()
```

**Input**:
```typescript
{
  userId: string; // User to follow
}
```

**Process**:
1. Verify user exists
2. Check not already following
3. Create follow relationship
4. Invalidate feed cache
5. Create notification (future)

**Returns**:
```typescript
{
  success: true;
  followingCount: number;
}
```

### Unfollow User

```typescript
follow.unfollow.useMutation()
```

**Input**:
```typescript
{
  userId: string; // User to unfollow
}
```

**Returns**:
```typescript
{
  success: true;
  followingCount: number;
}
```

### Get Followers

```typescript
follow.getFollowers.useQuery({
  userId: string;
  cursor?: string;
  limit?: number; // default: 50
})
```

**Returns**:
```typescript
{
  users: UserPreview[];
  nextCursor?: string;
}

type UserPreview = {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isFollowing: boolean; // If current user follows them
};
```

### Get Following

```typescript
follow.getFollowing.useQuery({
  userId: string;
  cursor?: string;
  limit?: number; // default: 50
})
```

**Returns**: Same as `getFollowers`


## Geographic Queries

### Get Posts Near Location

```typescript
geo.getPostsNearby.useQuery({
  lat: number;
  lng: number;
  radius?: number;  // in meters, default: 50000 (50km)
  limit?: number;   // default: 100
})
```

**Returns**:
```typescript
{
  posts: PostWithDistance[];
}

type PostWithDistance = Post & {
  distance: number; // in meters
  user: UserPreview;
};
```

### Get Map Pins

```typescript
geo.getMapPins.useQuery({
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  mode: 'local' | 'traveling';
  userId?: string; // For local mode
})
```

**Local Mode**:
- Returns only current user's pins

**Traveling Mode**:
- Returns all community pins in bounds
- Clustered by proximity

**Returns**:
```typescript
{
  pins: MapPin[];
  clusters: MapCluster[];
}

type MapPin = {
  id: string;
  lat: number;
  lng: number;
  placeId: string;
  placeName: string;
  postCount: number;  // Multiple posts at same location
  posts: Post[];      // Preview of posts
};

type MapCluster = {
  lat: number;
  lng: number;
  count: number;
  bounds: Bounds;
};
```

### Search Places

```typescript
geo.searchPlaces.useQuery({
  query: string;
  location?: {      // Bias results near location
    lat: number;
    lng: number;
  };
})
```

**Uses**: Google Places Autocomplete API

**Returns**:
```typescript
{
  places: PlaceResult[];
}

type PlaceResult = {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  types: string[];
};
```

### Get Place Details

```typescript
geo.getPlaceDetails.useQuery({
  placeId: string;
})
```

**Returns**:
```typescript
{
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  types: string[];
  photos: string[];
}
```


## Journal Entries

### Create Journal Entry

```typescript
journal.create.useMutation()
```

**Input**:
```typescript
{
  albumId: string;
  content: string;      // 1-10000 chars, markdown
  location?: {
    placeId: string;
    name: string;
  };
  date: Date;           // Can backdate entries
}
```

**Returns**: Created `JournalEntry` object

### Update Journal Entry

```typescript
journal.update.useMutation()
```

**Input**:
```typescript
{
  id: string;
  content?: string;
  location?: Location;
  date?: Date;
}
```

**Returns**: Updated `JournalEntry` object

### Delete Journal Entry

```typescript
journal.delete.useMutation()
```

**Input**:
```typescript
{
  id: string;
}
```

**Returns**: `{ success: true }`

## Activity Tracking

### Record View

```typescript
activity.recordView.useMutation()
```

**Input**:
```typescript
{
  targetType: 'post' | 'album';
  targetId: string;
}
```

**Process**:
- Increments view count
- Used for personalization
- Debounced (once per user per target per session)

### Save Content

```typescript
activity.save.useMutation()
```

**Input**:
```typescript
{
  targetType: 'post' | 'album';
  targetId: string;
}
```

**Returns**: `{ success: true, saveCount: number }`

### Unsave Content

```typescript
activity.unsave.useMutation()
```

**Input**: Same as `save`

**Returns**: Same as `save`

### Get Saved Content

```typescript
activity.getSaved.useQuery({
  type?: 'post' | 'album'; // Filter by type
  cursor?: string;
  limit?: number;
})
```

**Returns**:
```typescript
{
  items: (Post | Album)[];
  nextCursor?: string;
}
```


## Error Handling

All API errors follow tRPC error format:

```typescript
{
  error: {
    code: string;      // Error code
    message: string;   // Human-readable message
    data?: any;        // Additional error data
  }
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Not authenticated | 401 |
| `FORBIDDEN` | Authenticated but not authorized | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `BAD_REQUEST` | Invalid input | 400 |
| `CONFLICT` | Resource conflict (e.g., duplicate) | 409 |
| `TOO_MANY_REQUESTS` | Rate limit exceeded | 429 |
| `INTERNAL_SERVER_ERROR` | Server error | 500 |

### Example Error Response

```typescript
{
  error: {
    code: "BAD_REQUEST",
    message: "Caption must be between 1 and 5000 characters",
    data: {
      field: "caption",
      constraint: "length"
    }
  }
}
```

## Rate Limits

### Per-Endpoint Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `post.create` | 10 requests | 10 minutes |
| `album.create` | 5 requests | 10 minutes |
| `post.uploadPhotos` | 20 requests | 10 minutes |
| `follow.follow` | 30 requests | 1 minute |
| `geo.searchPlaces` | 60 requests | 1 minute |
| General queries | 100 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1678901234
```

### Rate Limit Error

```typescript
{
  error: {
    code: "TOO_MANY_REQUESTS",
    message: "Rate limit exceeded. Try again in 5 minutes.",
    data: {
      retryAfter: 300  // seconds
    }
  }
}
```

## Pagination

All list endpoints use cursor-based pagination:

**Request**:
```typescript
{
  cursor?: string;  // From previous response
  limit?: number;   // Max items per page
}
```

**Response**:
```typescript
{
  items: T[];
  nextCursor?: string;  // null if last page
}
```

**Example Usage**:
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['feed'],
  queryFn: ({ pageParam }) => 
    trpc.feed.get.query({ cursor: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

## Webhooks (Future)

For real-time notifications and integrations.

**Events**:
- `post.created`
- `album.created`
- `user.followed`
- `content.saved`

**Payload Format**:
```typescript
{
  event: string;
  timestamp: Date;
  data: any;
  userId: string;
}
```

---

*End of API Specification*
