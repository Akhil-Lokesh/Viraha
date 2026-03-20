# Frontend Pages Structure

**Viraha Pages** - Next.js App Router Structure

---

## App Directory Structure

```
app/
├── (auth)/
│   ├── sign-in/
│   │   └── page.tsx          # Sign in page
│   └── sign-up/
│       └── page.tsx           # Sign up page
├── (app)/
│   ├── layout.tsx             # Main app layout
│   ├── page.tsx               # Feed page (/)
│   ├── explore/
│   │   └── page.tsx           # Discover feed
│   ├── map/
│   │   └── page.tsx           # Map view
│   ├── create/
│   │   ├── post/
│   │   │   └── page.tsx       # Create post
│   │   └── album/
│   │       └── page.tsx       # Create album
│   ├── post/
│   │   └── [id]/
│   │       └── page.tsx       # Post detail
│   ├── album/
│   │   └── [id]/
│   │       ├── page.tsx       # Album detail
│   │       └── edit/
│   │           └── page.tsx   # Edit album
│   ├── profile/
│   │   └── [username]/
│   │       ├── page.tsx       # User profile
│   │       ├── posts/
│   │       │   └── page.tsx   # User posts
│   │       ├── albums/
│   │       │   └── page.tsx   # User albums
│   │       └── saved/
│   │           └── page.tsx   # Saved content
│   └── settings/
│       └── page.tsx           # User settings
└── api/
    └── trpc/
        └── [trpc]/
            └── route.ts       # tRPC API endpoint
```

## Page Details

### Home / Feed Page (`/`)

Main feed based on current mode (Local or Traveling).

**Features**:
- Mode toggle at top
- Infinite scroll feed
- Create post FAB (floating action button)
- Pull to refresh
- Empty state with onboarding

**Components Used**:
- `<ModeToggle />`
- `<FeedList />`
- `<PostCard />`

**Data Loading**:
```tsx
const { data, fetchNextPage, hasNextPage } = trpc.feed.get.useInfiniteQuery(
  { mode: userMode },
  { getNextPageParam: (lastPage) => lastPage.nextCursor }
);
```

### Map View Page (`/map`)

Interactive map showing pins based on mode.

**Features**:
- Full-screen map
- Mode-aware pin display
- Cluster nearby pins
- Pin popup with post preview
- Search location bar
- Geolocation button

**Components Used**:
- `<MapView />`
- `<LocationSearch />`
- `<PostCard />` (in popup)

**Data Loading**:
```tsx
const { data } = trpc.geo.getMapPins.useQuery({
  bounds: mapBounds,
  mode: userMode,
  userId: userMode === 'local' ? user.id : undefined,
});
```


### Create Post Page (`/create/post`)

Form to create a new post.

**Features**:
- Location autocomplete search
- Photo upload (1-4 images)
- Caption editor
- Mode badge toggle
- Preview before posting
- Draft save (localStorage)

**Components Used**:
- `<PostForm />`
- `<LocationSearch />`
- `<PhotoUpload />`

**Flow**:
1. User uploads photos
2. User searches and selects location
3. User writes caption
4. User submits → Photos uploaded to R2
5. Post created → Redirect to post detail

### Post Detail Page (`/post/[id]`)

Full post view with comments and engagement.

**Features**:
- Full-size photo carousel
- Complete caption
- Location map preview
- User info
- Save button
- Share button
- Edit/delete (if own post)

**Components Used**:
- `<PostCard />`
- `<UserProfile />`
- `<MapView />` (mini map)

**Data Loading**:
```tsx
const { data: post } = trpc.post.getById.useQuery({ id });
```

### Album Detail Page (`/album/[id]`)

Album view with posts, journals, and metadata.

**Features**:
- Cover image header
- Title and description
- Posts grid
- Journal entries list
- Location map with all pins
- Privacy indicator
- Edit button (if own album)

**Tabs**:
- Posts (grid view)
- Journal (chronological)
- Map (all locations)

**Components Used**:
- `<AlbumCard />`
- `<PostGrid />`
- `<JournalEntry />`
- `<MapView />`

**Data Loading**:
```tsx
const { data: album } = trpc.album.getById.useQuery({ id });
```

### Create Album Page (`/create/album`)

Form to create new album.

**Features**:
- Title and description fields
- Cover image selection
- Privacy toggle (public/private)
- Add posts from existing posts
- Create and redirect to album

**Components Used**:
- `<AlbumForm />`
- `<PostSelector />`


### User Profile Page (`/profile/[username]`)

User profile with posts, albums, and stats.

**Features**:
- Profile header (avatar, bio, stats)
- Follow/unfollow button
- Edit profile button (if own)
- Tabs: Posts, Albums, Saved
- Map of user's posts

**Tabs**:
- **Posts**: Grid of user's posts
- **Albums**: List of user's albums
- **Saved**: Saved posts/albums (if own profile)

**Components Used**:
- `<UserProfile />`
- `<PostGrid />`
- `<AlbumGrid />`
- `<FollowButton />`

**Data Loading**:
```tsx
const { data: user } = trpc.user.getById.useQuery({ userId });
const { data: posts } = trpc.post.getByUser.useQuery({ userId });
const { data: albums } = trpc.album.getByUser.useQuery({ userId });
```

### Settings Page (`/settings`)

User account and app settings.

**Sections**:
- **Profile**: Edit display name, bio, avatar
- **Account**: Email, password, delete account
- **Privacy**: Profile visibility, location sharing
- **Home Location**: Set/update home location
- **Notifications**: Email and push preferences (future)
- **Data**: Export data, delete account

**Components Used**:
- `<SettingsForm />`
- `<LocationSearch />`
- `<DangerZone />` (delete account)

### Explore Page (`/explore`)

Discover trending posts and users (future feature).

**Features**:
- Trending posts
- Suggested users to follow
- Popular destinations
- Recent highlights

**Components Used**:
- `<PostGrid />`
- `<UserCard />`
- `<TrendingPlaces />`

## Layout Components

### App Layout (`(app)/layout.tsx`)

Main app shell with navigation.

**Features**:
- Top nav bar
- Bottom nav (mobile)
- Side nav (desktop)
- User menu dropdown
- Mode indicator

**Navigation Items**:
- Feed (/)
- Map (/map)
- Create (modal)
- Profile (/profile/[username])
- Settings (/settings)

### Auth Layout (`(auth)/layout.tsx`)

Minimal layout for sign in/up pages.

**Features**:
- Centered form
- Viraha branding
- No navigation
- Clean background

## Mobile-First Design

All pages optimized for mobile:
- Bottom navigation bar
- Swipe gestures
- Pull to refresh
- Touch-optimized buttons
- Responsive grids

**Breakpoints**:
- Mobile: < 768px (default design)
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

*End of Pages Documentation*
