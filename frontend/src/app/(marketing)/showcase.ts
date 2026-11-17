// Illustrative content for the marketing page — not real user data.

export const HERO_PHOTO = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80';

export const SHOWCASE_TRAVELER = {
  username: 'wanderlust_nina',
  displayName: 'Nina Soleil',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&q=80',
} as const;

export const SHOWCASE_TRIP = {
  title: 'Greek Island Hopping',
  description:
    'Two weeks sailing between the Cycladic islands — from the volcanic shores of Santorini to the hidden coves of Milos.',
  coverPhoto: 'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800&q=80',
  postCount: 14,
  locations: [
    { id: 'athens', city: 'Athens', country: 'Greece' },
    { id: 'santorini', city: 'Santorini', country: 'Greece' },
    { id: 'zakynthos', city: 'Zakynthos', country: 'Greece' },
  ],
} as const;
