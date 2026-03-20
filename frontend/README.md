# Viraha Frontend

Next.js web application for Viraha travel memory platform.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 18+
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **Maps**: Mapbox GL JS
- **Image Optimization**: next/image
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Project Structure

```
frontend/
├── app/                  # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (main)/
│   │   ├── feed/
│   │   ├── discover/
│   │   ├── map/
│   │   ├── profile/
│   │   └── settings/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── posts/
│   │   ├── PostCard.tsx
│   │   ├── PostGrid.tsx
│   │   ├── PostDetail.tsx
│   │   └── CreatePostModal.tsx
│   ├── albums/
│   │   ├── AlbumCard.tsx
│   │   ├── AlbumGrid.tsx
│   │   └── CreateAlbumModal.tsx
│   ├── journals/
│   │   ├── JournalCard.tsx
│   │   ├── JournalEditor.tsx
│   │   └── EntryCard.tsx
│   ├── map/
│   │   ├── MapView.tsx
│   │   ├── LocationPicker.tsx
│   │   └── MarkerCluster.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   └── shared/
│       ├── Avatar.tsx
│       ├── ImageUpload.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── api/             # API client functions
│   │   ├── posts.ts
│   │   ├── albums.ts
│   │   ├── auth.ts
│   │   └── ...
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── usePosts.ts
│   │   ├── useMap.ts
│   │   └── ...
│   ├── stores/          # Zustand stores
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── mapStore.ts
│   ├── utils/
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   └── helpers.ts
│   └── types/
│       └── index.ts
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── styles/
│   └── globals.css
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Environment Variables

Create `.env.local`:

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_JOURNALS=true
NEXT_PUBLIC_ENABLE_SOCIAL=true
```

## Installation

```bash
# Clone and navigate
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
npm run format       # Format with Prettier
```

## Key Pages & Routes

### Public Routes
```
/                    # Landing page
/login               # Login
/register            # Register
/explore             # Public explore/discover
```

### Protected Routes (Require Auth)
```
/feed                # Personalized feed
/map                 # Interactive world map
/discover            # Discovery page
/scrapbook           # Personal scrapbook
/profile/:username   # User profile
/posts/:id           # Post detail
/albums/:id          # Album detail
/journals/:id        # Journal detail
/settings            # User settings
```

## State Management

### Zustand Stores

**Auth Store**:
```typescript
// lib/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({ 
        user: state.user ? { ...state.user, ...updates } : null 
      })),
    }),
    { name: 'auth-storage' }
  )
);
```

**UI Store**:
```typescript
// lib/stores/uiStore.ts
interface UIState {
  isTravelMode: boolean;
  mapView: 'world' | 'region' | 'detail';
  sidebarOpen: boolean;
  toggleTravelMode: () => void;
  setMapView: (view: 'world' | 'region' | 'detail') => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isTravelMode: false,
  mapView: 'world',
  sidebarOpen: true,
  toggleTravelMode: () => set((state) => ({ isTravelMode: !state.isTravelMode })),
  setMapView: (view) => set({ mapView: view }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

### TanStack Query (React Query)

```typescript
// lib/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '@/lib/api/posts';

export function usePosts(filters?: PostFilters) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => postsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: postsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
```

## API Client

### Base API Client

```typescript
// lib/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/lib/stores/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - try refresh or logout
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Posts API

```typescript
// lib/api/posts.ts
import api from './client';

export const postsApi = {
  getAll: (filters?: PostFilters) => 
    api.get('/posts', { params: filters }),
    
  getById: (id: string) => 
    api.get(`/posts/${id}`),
    
  create: (data: CreatePostData) => 
    api.post('/posts', data),
    
  update: (id: string, data: UpdatePostData) => 
    api.patch(`/posts/${id}`, data),
    
  delete: (id: string) => 
    api.delete(`/posts/${id}`),
    
  getNearby: (lat: number, lng: number, radius: number) =>
    api.get('/posts/nearby', { params: { lat, lng, radius } }),
};
```

## Components

### Post Card Component

```typescript
// components/posts/PostCard.tsx
import Image from 'next/image';
import { MapPin, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/shared/Avatar';

interface PostCardProps {
  post: Post;
  onClick?: () => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square">
        <Image
          src={post.mediaThumbnails[0] || post.mediaUrls[0]}
          alt={post.caption || 'Post image'}
          fill
          className="object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* User */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar
            src={post.user.avatar}
            alt={post.user.username}
            size="sm"
          />
          <span className="font-medium">{post.user.displayName}</span>
        </div>
        
        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-700 line-clamp-2 mb-2">
            {post.caption}
          </p>
        )}
        
        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            <span>{post.location.city}</span>
          </div>
          {post.commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle size={14} />
              <span>{post.commentCount}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### Map Component

```typescript
// components/map/MapView.tsx
'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapViewProps {
  posts: Post[];
  onMarkerClick?: (post: Post) => void;
  center?: [number, number];
  zoom?: number;
}

export function MapView({ posts, onMarkerClick, center, zoom = 2 }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center || [0, 0],
      zoom: zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add markers for posts
    posts.forEach((post) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.backgroundImage = `url(${post.mediaThumbnails[0]})`;
      el.style.backgroundSize = 'cover';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        onMarkerClick?.(post);
      });

      new mapboxgl.Marker(el)
        .setLngLat([post.location.lng, post.location.lat])
        .addTo(map.current!);
    });
  }, [posts, onMarkerClick]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
```

### Create Post Modal

```typescript
// components/posts/CreatePostModal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { LocationPicker } from '@/components/map/LocationPicker';
import { useCreatePost } from '@/lib/hooks/usePosts';

const createPostSchema = z.object({
  caption: z.string().max(2000).optional(),
  mediaUrls: z.array(z.string()).min(1).max(10),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string().optional(),
  }),
  privacy: z.enum(['private', 'followers', 'public']),
  tags: z.array(z.string()).optional(),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreatePostModal({ open, onClose }: CreatePostModalProps) {
  const [images, setImages] = useState<string[]>([]);
  const createPost = useCreatePost();
  
  const { register, handleSubmit, formState: { errors } } = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      privacy: 'followers',
    },
  });

  const onSubmit = async (data: CreatePostForm) => {
    try {
      await createPost.mutateAsync(data);
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Image Upload */}
          <ImageUpload
            images={images}
            onChange={setImages}
            maxImages={10}
          />
          
          {/* Caption */}
          <Textarea
            {...register('caption')}
            placeholder="Write a caption..."
            rows={3}
          />
          
          {/* Location Picker */}
          <LocationPicker
            onLocationSelect={(location) => {
              // Set location in form
            }}
          />
          
          {/* Privacy */}
          <select {...register('privacy')} className="w-full p-2 border rounded">
            <option value="private">Private</option>
            <option value="followers">Followers</option>
            <option value="public">Public</option>
          </select>
          
          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPost.isPending}>
              {createPost.isPending ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Styling

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef5ee',
          100: '#fde8d7',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### Global Styles

```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-white text-gray-900 antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition-colors;
  }
}
```

## Forms & Validation

### Using React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    // Handle login
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} type="email" />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input {...register('password')} type="password" />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

## Image Handling

### Upload to S3

```typescript
// lib/utils/imageUpload.ts
export async function uploadImage(file: File): Promise<string> {
  // Get signed upload URL from API
  const { uploadUrl, fileUrl } = await api.post('/media/upload', {
    filename: file.name,
    contentType: file.type,
  });

  // Upload directly to S3/R2
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  return fileUrl;
}
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src={post.mediaUrls[0]}
  alt="Post image"
  width={800}
  height={600}
  priority={index < 4} // Prioritize first 4 images
  placeholder="blur"
  blurDataURL={post.mediaThumbnails[0]}
/>
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <div>Loading map...</div>,
});
```

### Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

function FeedPage() {
  const { ref, inView } = useInView();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) => feedApi.get(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div>
      {data?.pages.map((page) => (
        page.items.map((item) => <PostCard key={item.id} post={item} />)
      ))}
      <div ref={ref}>{isFetchingNextPage && 'Loading...'}</div>
    </div>
  );
}
```

## Testing

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

```typescript
// __tests__/components/PostCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PostCard } from '@/components/posts/PostCard';

describe('PostCard', () => {
  const mockPost = {
    id: '1',
    caption: 'Test post',
    mediaUrls: ['https://example.com/image.jpg'],
    location: { city: 'Paris' },
    user: { username: 'testuser', displayName: 'Test User' },
  };

  it('renders post caption', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('Test post')).toBeInTheDocument();
  });
});
```

## Deployment

### Build for Production

```bash
npm run build
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Contributing

See main project README for contribution guidelines.

## License

TBD
