# Frontend Components

**Viraha Component Library** - React Components with shadcn/ui

---

## Component Structure

```
app/
├── components/
│   ├── ui/              # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/          # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ModeToggle.tsx
│   ├── post/            # Post-related
│   │   ├── PostCard.tsx
│   │   ├── PostForm.tsx
│   │   ├── PostGrid.tsx
│   │   └── PhotoUpload.tsx
│   ├── album/           # Album-related
│   │   ├── AlbumCard.tsx
│   │   ├── AlbumForm.tsx
│   │   └── AlbumGrid.tsx
│   ├── map/             # Map components
│   │   ├── MapView.tsx
│   │   ├── MapPin.tsx
│   │   └── LocationSearch.tsx
│   ├── feed/            # Feed components
│   │   ├── FeedList.tsx
│   │   ├── FeedItem.tsx
│   │   └── FeedFilter.tsx
│   └── user/            # User components
│       ├── UserProfile.tsx
│       ├── UserAvatar.tsx
│       └── FollowButton.tsx
```

## Core Components

### PostCard

Displays a single post with location, photos, and caption.

**Usage**:
```tsx
import { PostCard } from '@/components/post/PostCard';

<PostCard
  post={post}
  onSave={handleSave}
  onShare={handleShare}
  showUser={true}
/>
```

**Props**:
```typescript
interface PostCardProps {
  post: Post;
  onSave?: () => void;
  onShare?: () => void;
  showUser?: boolean;        // Show user info header
  showLocation?: boolean;    // Show location name
  compact?: boolean;         // Compact view
}
```

**Features**:
- Location tag (clickable)
- 1-4 photo grid (Twitter-style layout)
- Caption with read more/less
- Mode badge (local/traveling)
- Save button
- Share button
- Timestamp


### PostForm

Form for creating/editing posts.

**Usage**:
```tsx
import { PostForm } from '@/components/post/PostForm';

<PostForm
  onSubmit={handleSubmit}
  initialData={editingPost}
  mode="create"
/>
```

**Props**:
```typescript
interface PostFormProps {
  onSubmit: (data: PostFormData) => void;
  initialData?: Partial<Post>;
  mode: 'create' | 'edit';
}

interface PostFormData {
  placeId: string;
  placeName: string;
  caption: string;
  photos: File[];
  modeBadge?: 'local' | 'traveling';
}
```

**Features**:
- Location autocomplete (Google Places)
- Photo upload (1-4 images)
- Image preview with drag-to-reorder
- Caption textarea with character count
- Mode badge toggle
- Form validation

### MapView

Interactive map component using mapcn.

**Usage**:
```tsx
import { MapView } from '@/components/map/MapView';

<MapView
  pins={pins}
  onPinClick={handlePinClick}
  mode={userMode}
  center={userLocation}
/>
```

**Props**:
```typescript
interface MapViewProps {
  pins: MapPin[];
  onPinClick?: (pin: MapPin) => void;
  mode: 'local' | 'traveling';
  center?: {lat: number; lng: number};
  zoom?: number;
  showClustering?: boolean;
}
```

**Features**:
- Cluster nearby pins
- Custom pin icons
- Popup on pin click
- Zoom controls
- Geolocation button
- Different pin colors for own vs community posts

### FeedList

Infinite scrolling feed of posts and albums.

**Usage**:
```tsx
import { FeedList } from '@/components/feed/FeedList';

<FeedList
  mode={userMode}
  location={currentLocation}
  onPostClick={handlePostClick}
/>
```

**Props**:
```typescript
interface FeedListProps {
  mode: 'local' | 'traveling';
  location?: {lat: number; lng: number};
  onPostClick?: (postId: string) => void;
  filters?: FeedFilters;
}
```

**Features**:
- Infinite scroll
- Pull to refresh
- Empty states
- Loading skeleton
- Error handling
- Optimistic updates


### AlbumCard

Displays album with cover image and metadata.

**Usage**:
```tsx
import { AlbumCard } from '@/components/album/AlbumCard';

<AlbumCard
  album={album}
  onClick={handleClick}
  showPrivacy={true}
/>
```

**Props**:
```typescript
interface AlbumCardProps {
  album: Album;
  onClick?: () => void;
  showPrivacy?: boolean;
  variant?: 'default' | 'compact';
}
```

**Features**:
- Cover image
- Title and description
- Privacy indicator
- Post count
- Location chips (derived from posts)
- User info

### UserProfile

User profile header component.

**Usage**:
```tsx
import { UserProfile } from '@/components/user/UserProfile';

<UserProfile
  user={user}
  isOwnProfile={isOwnProfile}
  onFollow={handleFollow}
/>
```

**Props**:
```typescript
interface UserProfileProps {
  user: User;
  isOwnProfile: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
}
```

**Features**:
- Avatar
- Display name and username
- Bio
- Stats (posts, albums, followers, following)
- Follow button
- Edit button (if own profile)
- Home location

### ModeToggle

Toggle between Local and Traveling modes.

**Usage**:
```tsx
import { ModeToggle } from '@/components/layout/ModeToggle';

<ModeToggle
  currentMode={mode}
  onModeChange={handleModeChange}
  detectedMode={detectedMode}
/>
```

**Props**:
```typescript
interface ModeToggleProps {
  currentMode: 'local' | 'traveling';
  onModeChange: (mode: 'local' | 'traveling') => void;
  detectedMode?: 'local' | 'traveling';
}
```

**Features**:
- Visual indicator of current mode
- Shows GPS detection suggestion
- Confirmation dialog when switching
- Explains mode difference


### PhotoUpload

Drag-and-drop photo upload component.

**Usage**:
```tsx
import { PhotoUpload } from '@/components/post/PhotoUpload';

<PhotoUpload
  onUpload={handleUpload}
  maxPhotos={4}
  existingPhotos={photos}
/>
```

**Props**:
```typescript
interface PhotoUploadProps {
  onUpload: (files: File[]) => void;
  maxPhotos?: number;  // default: 4
  existingPhotos?: string[];
  onRemove?: (index: number) => void;
  onReorder?: (photos: string[]) => void;
}
```

**Features**:
- Drag and drop
- Click to browse
- Preview thumbnails
- Drag to reorder
- Remove button
- Validation (file type, size, count)
- Compression before upload

### LocationSearch

Google Places autocomplete search.

**Usage**:
```tsx
import { LocationSearch } from '@/components/map/LocationSearch';

<LocationSearch
  onSelect={handleLocationSelect}
  biasLocation={userLocation}
/>
```

**Props**:
```typescript
interface LocationSearchProps {
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  biasLocation?: {lat: number; lng: number};
  defaultValue?: string;
}
```

**Features**:
- Autocomplete suggestions
- Location bias (nearby results first)
- Clear button
- Loading state
- Error handling

## Shared UI Components (shadcn/ui)

### Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="md">
  Click me
</Button>
```

**Variants**: `default`, `destructive`, `outline`, `ghost`, `link`  
**Sizes**: `sm`, `md`, `lg`, `icon`

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {children}
  </DialogContent>
</Dialog>
```

### Input

```tsx
import { Input } from '@/components/ui/input';

<Input
  type="text"
  placeholder="Enter text..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Textarea

```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea
  placeholder="Write caption..."
  rows={4}
  maxLength={5000}
/>
```

### Avatar

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src={user.avatar} alt={user.displayName} />
  <AvatarFallback>{user.displayName[0]}</AvatarFallback>
</Avatar>
```

---

*End of Components Documentation*
