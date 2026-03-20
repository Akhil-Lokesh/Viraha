export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  homeCity: string | null;
  homeCountry: string | null;
  homeLat: number | null;
  homeLng: number | null;
  isPrivate: boolean;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  caption: string | null;
  mediaUrls: string[];
  mediaThumbnails: string[];
  locationLat: number;
  locationLng: number;
  locationName: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  placeId: string | null;
  takenAt: string | null;
  postedAt: string;
  privacy: string;
  tags: string[];
  commentCount: number;
  saveCount: number;
  isSaved?: boolean;
  isDeleted: boolean;
  travelMode?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface UserProfile extends User {
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  _count?: {
    posts: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: User;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  cursor?: string;
  hasMore?: boolean;
  error?: string;
}

export interface CreatePostInput {
  caption?: string;
  mediaUrls: string[];
  mediaThumbnails: string[];
  locationLat: number;
  locationLng: number;
  locationName?: string;
  locationCity?: string;
  locationCountry?: string;
  placeId?: string;
  takenAt?: string;
  privacy?: string;
  tags?: string[];
  travelMode?: string;
}

export interface UpdatePostInput {
  caption?: string;
  privacy?: string;
  tags?: string[];
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatar?: string;
  homeCity?: string;
  homeCountry?: string;
  homeLat?: number;
  homeLng?: number;
  isPrivate?: boolean;
  showLocation?: boolean;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  text: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  replyCount?: number;
}

export interface Activity {
  id: string;
  userId: string;
  actorId: string;
  type: 'follow' | 'comment' | 'reply' | 'save';
  postId: string | null;
  commentId: string | null;
  read: boolean;
  createdAt: string;
  actor?: User;
  post?: {
    id: string;
    caption: string | null;
    mediaUrls: string[];
    mediaThumbnails: string[];
    locationName: string | null;
  } | null;
  comment?: {
    id: string;
    text: string;
  } | null;
}

export interface CreateCommentInput {
  text: string;
  parentId?: string;
}

export interface UpdateCommentInput {
  text: string;
}

export interface Album {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  privacy: string;
  slug: string;
  postCount: number;
  startDate: string | null;
  endDate: string | null;
  viewCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  albumPosts?: AlbumPost[];
}

export interface AlbumPost {
  id: string;
  albumId: string;
  postId: string;
  sortOrder: number;
  createdAt: string;
  post?: Post;
}

export interface CreateAlbumInput {
  title: string;
  description?: string;
  coverImage?: string;
  privacy?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateAlbumInput {
  title?: string;
  description?: string | null;
  coverImage?: string | null;
  privacy?: string;
  startDate?: string | null;
  endDate?: string | null;
}

// ─── Journals ────────────────────────────────────────

export interface Journal {
  id: string;
  userId: string;
  title: string;
  summary: string | null;
  coverImage: string | null;
  slug: string;
  privacy: string;
  status: 'draft' | 'published';
  entryCount: number;
  startDate: string | null;
  endDate: string | null;
  wordCount: number;
  viewCount: number;
  publishedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  entries?: JournalEntry[];
}

export interface JournalEntry {
  id: string;
  journalId: string;
  date: string | null;
  title: string | null;
  content: string | null;
  mediaUrls: string[];
  mood: string | null;
  locationLat: number | null;
  locationLng: number | null;
  locationName: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  weatherCondition: string | null;
  weatherTemp: number | null;
  weatherUnit: string | null;
  sortOrder: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalInput {
  title: string;
  summary?: string;
  coverImage?: string;
  privacy?: string;
  status?: 'draft' | 'published';
}

export interface UpdateJournalInput {
  title?: string;
  summary?: string | null;
  coverImage?: string | null;
  privacy?: string;
  status?: 'draft' | 'published';
}

export interface CreateJournalEntryInput {
  date?: string;
  title?: string;
  content?: string;
  mediaUrls?: string[];
  mood?: string;
  locationLat?: number;
  locationLng?: number;
  locationName?: string;
  locationCity?: string;
  locationCountry?: string;
  weatherCondition?: string;
  weatherTemp?: number;
  weatherUnit?: string;
}

export interface UpdateJournalEntryInput {
  date?: string | null;
  title?: string | null;
  content?: string | null;
  mediaUrls?: string[];
  mood?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationName?: string | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  weatherCondition?: string | null;
  weatherTemp?: number | null;
  weatherUnit?: string | null;
}

// ─── Map ─────────────────────────────────────────────

export interface MapMarkerData {
  id: string;
  type: 'post' | 'journal';
  lat: number;
  lng: number;
  thumbnail: string | null;
  title: string;
  locationName: string | null;
  journalId?: string;
  date?: string;
}

// ─── Explore ─────────────────────────────────────────

export interface TrendingLocation {
  city: string;
  country: string;
  photo: string | null;
  count: number;
}

export interface TrendingTag {
  tag: string;
  count: number;
}

// ─── Places ──────────────────────────────────────────

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
}
