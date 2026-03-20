import type { Post, User, UserProfile } from './types';

// Unsplash travel photo URLs (free to use)
const TRAVEL_PHOTOS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', // Beach
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80', // Mountain lake
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', // Paris
  'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80', // Venice
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80', // Tropical beach
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80', // Kyoto
  'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800&q=80', // Santorini
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80', // Travel flat lay
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80', // Road trip
  'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80', // Vietnam
  'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80', // Iceland
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80', // Italy coast
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80', // Paris 2
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80', // London
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80', // Bali
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80', // Travel
  'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?w=800&q=80', // Landscape
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80', // Mountain sunset
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80', // Forest
  'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80', // Desert
];

const HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80',
  'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1920&q=80',
];

const AVATAR_PHOTOS = [
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
];

const COVER_PHOTOS = [
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80',
];

export interface MockTrip {
  id: string;
  title: string;
  description: string;
  coverPhoto: string;
  startDate: string;
  endDate: string;
  locations: MockLocation[];
  postCount: number;
  userId: string;
}

export interface MockLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  photo: string;
}

export interface MockComment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
}

// ─── Users ────────────────────────────────────────────
export const mockUsers: UserProfile[] = [
  {
    id: 'u1',
    username: 'wanderlust_nina',
    email: 'nina@example.com',
    displayName: 'Nina Soleil',
    bio: 'Chasing sunsets and collecting memories. Solo traveler exploring the world one city at a time.',
    avatar: AVATAR_PHOTOS[0],
    homeCity: 'Barcelona',
    homeCountry: 'Spain',
    homeLat: 41.3874,
    homeLng: 2.1686,
    isPrivate: false,
    emailVerified: true,
    isActive: true,
    lastLoginAt: '2025-03-10T08:00:00Z',
    createdAt: '2024-06-15T00:00:00Z',
    updatedAt: '2025-03-10T08:00:00Z',
    _count: { posts: 47 },
  },
  {
    id: 'u2',
    username: 'kai_explorer',
    email: 'kai@example.com',
    displayName: 'Kai Tanaka',
    bio: 'Mountain lover. Photographer. Always looking for the next trail.',
    avatar: AVATAR_PHOTOS[1],
    homeCity: 'Tokyo',
    homeCountry: 'Japan',
    homeLat: 35.6762,
    homeLng: 139.6503,
    isPrivate: false,
    emailVerified: true,
    isActive: true,
    lastLoginAt: '2025-03-09T14:00:00Z',
    createdAt: '2024-08-20T00:00:00Z',
    updatedAt: '2025-03-09T14:00:00Z',
    _count: { posts: 32 },
  },
  {
    id: 'u3',
    username: 'maya_writes',
    email: 'maya@example.com',
    displayName: 'Maya Chen',
    bio: 'Travel writer & food enthusiast. Every dish tells a story.',
    avatar: AVATAR_PHOTOS[2],
    homeCity: 'San Francisco',
    homeCountry: 'USA',
    homeLat: 37.7749,
    homeLng: -122.4194,
    isPrivate: false,
    emailVerified: true,
    isActive: true,
    lastLoginAt: '2025-03-08T20:00:00Z',
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2025-03-08T20:00:00Z',
    _count: { posts: 65 },
  },
  {
    id: 'u4',
    username: 'road_less_taken',
    email: 'alex@example.com',
    displayName: 'Alex Rivera',
    bio: 'Off-the-beaten-path explorer. If there is no trail, I make one.',
    avatar: AVATAR_PHOTOS[3],
    homeCity: 'Lisbon',
    homeCountry: 'Portugal',
    homeLat: 38.7223,
    homeLng: -9.1393,
    isPrivate: false,
    emailVerified: true,
    isActive: true,
    lastLoginAt: '2025-03-10T06:00:00Z',
    createdAt: '2024-09-12T00:00:00Z',
    updatedAt: '2025-03-10T06:00:00Z',
    _count: { posts: 28 },
  },
  {
    id: 'u5',
    username: 'sophie_adventures',
    email: 'sophie@example.com',
    displayName: 'Sophie Laurent',
    bio: 'Architecture lover exploring the built world. European cities are my canvas.',
    avatar: AVATAR_PHOTOS[4],
    homeCity: 'Paris',
    homeCountry: 'France',
    homeLat: 48.8566,
    homeLng: 2.3522,
    isPrivate: false,
    emailVerified: true,
    isActive: true,
    lastLoginAt: '2025-03-07T12:00:00Z',
    createdAt: '2024-07-03T00:00:00Z',
    updatedAt: '2025-03-07T12:00:00Z',
    _count: { posts: 41 },
  },
];

// ─── Posts ─────────────────────────────────────────────
export const mockPosts: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    caption: 'Golden hour at the cliffs of Santorini. The way the light paints these white-washed buildings is something photographs can never fully capture.',
    mediaUrls: [TRAVEL_PHOTOS[6], TRAVEL_PHOTOS[11]],
    mediaThumbnails: [TRAVEL_PHOTOS[6], TRAVEL_PHOTOS[11]],
    locationLat: 36.3932,
    locationLng: 25.4615,
    locationName: 'Oia',
    locationCity: 'Santorini',
    locationCountry: 'Greece',
    placeId: null,
    takenAt: '2025-02-20T17:30:00Z',
    postedAt: '2025-02-21T08:00:00Z',
    privacy: 'public',
    tags: ['santorini', 'greece', 'sunset', 'goldenhour'],
    commentCount: 12,
    saveCount: 34,
    isDeleted: false,
    createdAt: '2025-02-21T08:00:00Z',
    updatedAt: '2025-02-21T08:00:00Z',
    user: mockUsers[0],
  },
  {
    id: 'p2',
    userId: 'u2',
    caption: 'Found this hidden trail in the Swiss Alps. Three hours of climbing and not a single other soul in sight. Worth every step.',
    mediaUrls: [TRAVEL_PHOTOS[1], TRAVEL_PHOTOS[17]],
    mediaThumbnails: [TRAVEL_PHOTOS[1], TRAVEL_PHOTOS[17]],
    locationLat: 46.5197,
    locationLng: 7.5661,
    locationName: 'Lauterbrunnen Valley',
    locationCity: 'Lauterbrunnen',
    locationCountry: 'Switzerland',
    placeId: null,
    takenAt: '2025-01-15T10:00:00Z',
    postedAt: '2025-01-16T14:00:00Z',
    privacy: 'public',
    tags: ['switzerland', 'alps', 'hiking', 'mountains'],
    commentCount: 8,
    saveCount: 22,
    isDeleted: false,
    createdAt: '2025-01-16T14:00:00Z',
    updatedAt: '2025-01-16T14:00:00Z',
    user: mockUsers[1],
  },
  {
    id: 'p3',
    userId: 'u3',
    caption: 'The ramen at this tiny shop in Kyoto has been perfected over four generations. The broth takes 18 hours to prepare. Some things cannot be rushed.',
    mediaUrls: [TRAVEL_PHOTOS[5]],
    mediaThumbnails: [TRAVEL_PHOTOS[5]],
    locationLat: 35.0116,
    locationLng: 135.7681,
    locationName: 'Gion District',
    locationCity: 'Kyoto',
    locationCountry: 'Japan',
    placeId: null,
    takenAt: '2025-03-01T12:30:00Z',
    postedAt: '2025-03-01T18:00:00Z',
    privacy: 'public',
    tags: ['kyoto', 'japan', 'ramen', 'foodie'],
    commentCount: 15,
    saveCount: 45,
    isDeleted: false,
    createdAt: '2025-03-01T18:00:00Z',
    updatedAt: '2025-03-01T18:00:00Z',
    user: mockUsers[2],
  },
  {
    id: 'p4',
    userId: 'u4',
    caption: 'Waking up to this view in the Sahara. The silence of the desert at dawn is unlike anything else on earth.',
    mediaUrls: [TRAVEL_PHOTOS[19], TRAVEL_PHOTOS[8]],
    mediaThumbnails: [TRAVEL_PHOTOS[19], TRAVEL_PHOTOS[8]],
    locationLat: 31.5085,
    locationLng: -4.0108,
    locationName: 'Merzouga Dunes',
    locationCity: 'Merzouga',
    locationCountry: 'Morocco',
    placeId: null,
    takenAt: '2025-02-10T06:15:00Z',
    postedAt: '2025-02-10T20:00:00Z',
    privacy: 'public',
    tags: ['sahara', 'morocco', 'desert', 'sunrise'],
    commentCount: 19,
    saveCount: 51,
    isDeleted: false,
    createdAt: '2025-02-10T20:00:00Z',
    updatedAt: '2025-02-10T20:00:00Z',
    user: mockUsers[3],
  },
  {
    id: 'p5',
    userId: 'u5',
    caption: 'Venice in winter — no crowds, just the sound of water lapping against centuries-old stone. This is how you experience a city.',
    mediaUrls: [TRAVEL_PHOTOS[3]],
    mediaThumbnails: [TRAVEL_PHOTOS[3]],
    locationLat: 45.4408,
    locationLng: 12.3155,
    locationName: 'Grand Canal',
    locationCity: 'Venice',
    locationCountry: 'Italy',
    placeId: null,
    takenAt: '2025-01-05T09:00:00Z',
    postedAt: '2025-01-05T15:00:00Z',
    privacy: 'public',
    tags: ['venice', 'italy', 'winter', 'canals'],
    commentCount: 7,
    saveCount: 18,
    isDeleted: false,
    createdAt: '2025-01-05T15:00:00Z',
    updatedAt: '2025-01-05T15:00:00Z',
    user: mockUsers[4],
  },
  {
    id: 'p6',
    userId: 'u1',
    caption: 'Lost in the backstreets of Paris. Every corner is a painting waiting to be discovered.',
    mediaUrls: [TRAVEL_PHOTOS[2], TRAVEL_PHOTOS[12]],
    mediaThumbnails: [TRAVEL_PHOTOS[2], TRAVEL_PHOTOS[12]],
    locationLat: 48.8566,
    locationLng: 2.3522,
    locationName: 'Le Marais',
    locationCity: 'Paris',
    locationCountry: 'France',
    placeId: null,
    takenAt: '2025-02-28T16:00:00Z',
    postedAt: '2025-02-28T22:00:00Z',
    privacy: 'public',
    tags: ['paris', 'france', 'streets', 'architecture'],
    commentCount: 5,
    saveCount: 14,
    isDeleted: false,
    createdAt: '2025-02-28T22:00:00Z',
    updatedAt: '2025-02-28T22:00:00Z',
    user: mockUsers[0],
  },
  {
    id: 'p7',
    userId: 'u2',
    caption: 'The rice terraces of Bali stretch for miles. Standing here, you understand why people come and never leave.',
    mediaUrls: [TRAVEL_PHOTOS[14]],
    mediaThumbnails: [TRAVEL_PHOTOS[14]],
    locationLat: -8.4095,
    locationLng: 115.1889,
    locationName: 'Tegallalang',
    locationCity: 'Ubud',
    locationCountry: 'Indonesia',
    placeId: null,
    takenAt: '2025-01-20T08:00:00Z',
    postedAt: '2025-01-20T14:00:00Z',
    privacy: 'public',
    tags: ['bali', 'indonesia', 'riceterraces', 'nature'],
    commentCount: 11,
    saveCount: 38,
    isDeleted: false,
    createdAt: '2025-01-20T14:00:00Z',
    updatedAt: '2025-01-20T14:00:00Z',
    user: mockUsers[1],
  },
  {
    id: 'p8',
    userId: 'u3',
    caption: 'London in the rain has its own kind of beauty. The city feels more intimate when the tourists retreat.',
    mediaUrls: [TRAVEL_PHOTOS[13]],
    mediaThumbnails: [TRAVEL_PHOTOS[13]],
    locationLat: 51.5074,
    locationLng: -0.1278,
    locationName: 'South Bank',
    locationCity: 'London',
    locationCountry: 'United Kingdom',
    placeId: null,
    takenAt: '2025-03-05T11:00:00Z',
    postedAt: '2025-03-05T18:00:00Z',
    privacy: 'public',
    tags: ['london', 'uk', 'rain', 'citylife'],
    commentCount: 4,
    saveCount: 9,
    isDeleted: false,
    createdAt: '2025-03-05T18:00:00Z',
    updatedAt: '2025-03-05T18:00:00Z',
    user: mockUsers[2],
  },
  {
    id: 'p9',
    userId: 'u4',
    caption: 'Iceland stripped to its essence. Fire, ice, and the most dramatic light I have ever witnessed.',
    mediaUrls: [TRAVEL_PHOTOS[10], TRAVEL_PHOTOS[18]],
    mediaThumbnails: [TRAVEL_PHOTOS[10], TRAVEL_PHOTOS[18]],
    locationLat: 64.1466,
    locationLng: -21.9426,
    locationName: 'Golden Circle',
    locationCity: 'Reykjavik',
    locationCountry: 'Iceland',
    placeId: null,
    takenAt: '2025-02-05T14:00:00Z',
    postedAt: '2025-02-06T10:00:00Z',
    privacy: 'public',
    tags: ['iceland', 'nature', 'landscape', 'adventure'],
    commentCount: 21,
    saveCount: 67,
    isDeleted: false,
    createdAt: '2025-02-06T10:00:00Z',
    updatedAt: '2025-02-06T10:00:00Z',
    user: mockUsers[3],
  },
  {
    id: 'p10',
    userId: 'u5',
    caption: 'The Vietnamese countryside moves at its own pace. Motorbike through the northern mountains and you will find villages untouched by time.',
    mediaUrls: [TRAVEL_PHOTOS[9]],
    mediaThumbnails: [TRAVEL_PHOTOS[9]],
    locationLat: 22.3354,
    locationLng: 104.8533,
    locationName: 'Ha Giang Loop',
    locationCity: 'Ha Giang',
    locationCountry: 'Vietnam',
    placeId: null,
    takenAt: '2025-01-28T09:00:00Z',
    postedAt: '2025-01-29T07:00:00Z',
    privacy: 'public',
    tags: ['vietnam', 'motorbike', 'mountains', 'adventure'],
    commentCount: 14,
    saveCount: 42,
    isDeleted: false,
    createdAt: '2025-01-29T07:00:00Z',
    updatedAt: '2025-01-29T07:00:00Z',
    user: mockUsers[4],
  },
  {
    id: 'p11',
    userId: 'u1',
    caption: 'A tropical paradise that reminds you why we travel — to feel small, to feel alive.',
    mediaUrls: [TRAVEL_PHOTOS[4], TRAVEL_PHOTOS[0]],
    mediaThumbnails: [TRAVEL_PHOTOS[4], TRAVEL_PHOTOS[0]],
    locationLat: 4.1755,
    locationLng: 73.5093,
    locationName: 'North Malé Atoll',
    locationCity: 'Malé',
    locationCountry: 'Maldives',
    placeId: null,
    takenAt: '2025-03-08T07:00:00Z',
    postedAt: '2025-03-08T16:00:00Z',
    privacy: 'public',
    tags: ['maldives', 'beach', 'tropical', 'paradise'],
    commentCount: 9,
    saveCount: 55,
    isDeleted: false,
    createdAt: '2025-03-08T16:00:00Z',
    updatedAt: '2025-03-08T16:00:00Z',
    user: mockUsers[0],
  },
  {
    id: 'p12',
    userId: 'u2',
    caption: 'Italian coastal roads are meant for slow driving with the windows down.',
    mediaUrls: [TRAVEL_PHOTOS[11], TRAVEL_PHOTOS[15]],
    mediaThumbnails: [TRAVEL_PHOTOS[11], TRAVEL_PHOTOS[15]],
    locationLat: 40.6340,
    locationLng: 14.6027,
    locationName: 'Amalfi Coast',
    locationCity: 'Amalfi',
    locationCountry: 'Italy',
    placeId: null,
    takenAt: '2025-02-14T15:00:00Z',
    postedAt: '2025-02-15T09:00:00Z',
    privacy: 'public',
    tags: ['italy', 'amalfi', 'coast', 'roadtrip'],
    commentCount: 6,
    saveCount: 27,
    isDeleted: false,
    createdAt: '2025-02-15T09:00:00Z',
    updatedAt: '2025-02-15T09:00:00Z',
    user: mockUsers[1],
  },
];

// ─── Mock Comments ────────────────────────────────────
export const mockComments: MockComment[] = [
  { id: 'c1', userId: 'u2', text: 'This is absolutely stunning! Adding to my bucket list.', createdAt: '2025-02-21T10:00:00Z', user: { id: 'u2', username: 'kai_explorer', displayName: 'Kai Tanaka', avatar: AVATAR_PHOTOS[1] } },
  { id: 'c2', userId: 'u3', text: 'The light in this photo is magical. Were you there during the blue hour?', createdAt: '2025-02-21T12:30:00Z', user: { id: 'u3', username: 'maya_writes', displayName: 'Maya Chen', avatar: AVATAR_PHOTOS[2] } },
  { id: 'c3', userId: 'u4', text: 'I was just here! Such an unforgettable place.', createdAt: '2025-02-22T08:00:00Z', user: { id: 'u4', username: 'road_less_taken', displayName: 'Alex Rivera', avatar: AVATAR_PHOTOS[3] } },
  { id: 'c4', userId: 'u5', text: 'Your photography never disappoints. Keep exploring!', createdAt: '2025-02-22T14:00:00Z', user: { id: 'u5', username: 'sophie_adventures', displayName: 'Sophie Laurent', avatar: AVATAR_PHOTOS[4] } },
];

// ─── Trips ────────────────────────────────────────────
export const mockTrips: MockTrip[] = [
  {
    id: 't1',
    title: 'Greek Island Hopping',
    description: 'Two weeks sailing between the Cycladic islands — from the volcanic shores of Santorini to the hidden coves of Milos.',
    coverPhoto: TRAVEL_PHOTOS[6],
    startDate: '2025-02-15',
    endDate: '2025-03-01',
    locations: [
      { id: 'l1', name: 'Acropolis', city: 'Athens', country: 'Greece', lat: 37.9715, lng: 23.7267, photo: TRAVEL_PHOTOS[16] },
      { id: 'l2', name: 'Oia Sunset Point', city: 'Santorini', country: 'Greece', lat: 36.4618, lng: 25.3753, photo: TRAVEL_PHOTOS[6] },
      { id: 'l3', name: 'Navagio Beach', city: 'Zakynthos', country: 'Greece', lat: 37.8597, lng: 20.6247, photo: TRAVEL_PHOTOS[4] },
    ],
    postCount: 14,
    userId: 'u1',
  },
  {
    id: 't2',
    title: 'Alps to Adriatic',
    description: 'A road trip from the Swiss Alps through the Italian Dolomites to the Croatian coast.',
    coverPhoto: TRAVEL_PHOTOS[1],
    startDate: '2025-01-10',
    endDate: '2025-01-25',
    locations: [
      { id: 'l4', name: 'Lauterbrunnen', city: 'Interlaken', country: 'Switzerland', lat: 46.5936, lng: 7.9085, photo: TRAVEL_PHOTOS[1] },
      { id: 'l5', name: 'Tre Cime', city: 'Dolomites', country: 'Italy', lat: 46.6186, lng: 12.3033, photo: TRAVEL_PHOTOS[17] },
      { id: 'l6', name: 'Dubrovnik Old Town', city: 'Dubrovnik', country: 'Croatia', lat: 42.6507, lng: 18.0944, photo: TRAVEL_PHOTOS[16] },
    ],
    postCount: 22,
    userId: 'u2',
  },
  {
    id: 't3',
    title: 'Japan in Bloom',
    description: 'Cherry blossom season from Tokyo to Kyoto, with hidden temples and unforgettable food along the way.',
    coverPhoto: TRAVEL_PHOTOS[5],
    startDate: '2025-03-01',
    endDate: '2025-03-14',
    locations: [
      { id: 'l7', name: 'Shibuya', city: 'Tokyo', country: 'Japan', lat: 35.6595, lng: 139.7004, photo: TRAVEL_PHOTOS[15] },
      { id: 'l8', name: 'Fushimi Inari', city: 'Kyoto', country: 'Japan', lat: 34.9671, lng: 135.7727, photo: TRAVEL_PHOTOS[5] },
    ],
    postCount: 18,
    userId: 'u3',
  },
  {
    id: 't4',
    title: 'North Africa Expedition',
    description: 'From the medinas of Marrakech to the silence of the Sahara dunes.',
    coverPhoto: TRAVEL_PHOTOS[19],
    startDate: '2025-02-05',
    endDate: '2025-02-18',
    locations: [
      { id: 'l9', name: 'Jemaa el-Fnaa', city: 'Marrakech', country: 'Morocco', lat: 31.6258, lng: -7.9891, photo: TRAVEL_PHOTOS[15] },
      { id: 'l10', name: 'Merzouga Dunes', city: 'Merzouga', country: 'Morocco', lat: 31.0801, lng: -4.0133, photo: TRAVEL_PHOTOS[19] },
    ],
    postCount: 11,
    userId: 'u4',
  },
  {
    id: 't5',
    title: 'Vietnam by Motorbike',
    description: 'The legendary Ha Giang Loop and beyond — 2000km on two wheels through the most beautiful country in Southeast Asia.',
    coverPhoto: TRAVEL_PHOTOS[9],
    startDate: '2025-01-20',
    endDate: '2025-02-08',
    locations: [
      { id: 'l11', name: 'Ha Giang Loop', city: 'Ha Giang', country: 'Vietnam', lat: 22.8265, lng: 104.9838, photo: TRAVEL_PHOTOS[9] },
      { id: 'l12', name: 'Ha Long Bay', city: 'Quang Ninh', country: 'Vietnam', lat: 20.9101, lng: 107.1839, photo: TRAVEL_PHOTOS[0] },
    ],
    postCount: 25,
    userId: 'u5',
  },
  {
    id: 't6',
    title: 'Nordic Light',
    description: 'Chasing the northern lights from Iceland to Norway — a winter adventure in the land of fire and ice.',
    coverPhoto: TRAVEL_PHOTOS[10],
    startDate: '2025-02-01',
    endDate: '2025-02-12',
    locations: [
      { id: 'l13', name: 'Golden Circle', city: 'Reykjavik', country: 'Iceland', lat: 64.3271, lng: -20.1199, photo: TRAVEL_PHOTOS[10] },
      { id: 'l14', name: 'Lofoten Islands', city: 'Lofoten', country: 'Norway', lat: 68.2496, lng: 14.5676, photo: TRAVEL_PHOTOS[18] },
    ],
    postCount: 16,
    userId: 'u4',
  },
];

// ─── Trending locations ───────────────────────────────
export const trendingLocations: MockLocation[] = [
  { id: 'tl1', name: 'Santorini', city: 'Santorini', country: 'Greece', lat: 36.3932, lng: 25.4615, photo: TRAVEL_PHOTOS[6] },
  { id: 'tl2', name: 'Kyoto', city: 'Kyoto', country: 'Japan', lat: 35.0116, lng: 135.7681, photo: TRAVEL_PHOTOS[5] },
  { id: 'tl3', name: 'Bali', city: 'Ubud', country: 'Indonesia', lat: -8.5069, lng: 115.2625, photo: TRAVEL_PHOTOS[14] },
  { id: 'tl4', name: 'Iceland', city: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426, photo: TRAVEL_PHOTOS[10] },
  { id: 'tl5', name: 'Paris', city: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, photo: TRAVEL_PHOTOS[2] },
  { id: 'tl6', name: 'Amalfi Coast', city: 'Amalfi', country: 'Italy', lat: 40.6340, lng: 14.6027, photo: TRAVEL_PHOTOS[11] },
];

// ─── Categories ───────────────────────────────────────
export const categories = [
  { id: 'cat1', name: 'Cities', icon: '🏙️' },
  { id: 'cat2', name: 'Mountains', icon: '🏔️' },
  { id: 'cat3', name: 'Beaches', icon: '🏖️' },
  { id: 'cat4', name: 'Historical', icon: '🏛️' },
  { id: 'cat5', name: 'Food', icon: '🍜' },
  { id: 'cat6', name: 'Adventure', icon: '🧗' },
  { id: 'cat7', name: 'Nature', icon: '🌿' },
  { id: 'cat8', name: 'Culture', icon: '🎭' },
];

// ─── Helpers ──────────────────────────────────────────
export const heroPhotos = HERO_PHOTOS;
export const coverPhotos = COVER_PHOTOS;

export function getMockUser(id: string): UserProfile | undefined {
  return mockUsers.find((u) => u.id === id);
}

export function getMockUserByUsername(username: string): UserProfile | undefined {
  return mockUsers.find((u) => u.username === username);
}

export function getMockPostsByUser(userId: string): Post[] {
  return mockPosts.filter((p) => p.userId === userId);
}

export function getMockPost(id: string): Post | undefined {
  return mockPosts.find((p) => p.id === id);
}
