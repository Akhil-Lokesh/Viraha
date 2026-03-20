export interface MockAlbum {
  id: string;
  title: string;
  location: string;
  photos: number;
  cover: string;
}

export const MOCK_ALBUMS: MockAlbum[] = [
  { id: 'thailand', title: 'Thailand', location: 'Bangkok', photos: 248, cover: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&q=80' },
  { id: 'japan', title: 'Japan', location: 'Tokyo', photos: 342, cover: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80' },
  { id: 'france', title: 'France', location: 'Paris', photos: 189, cover: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80' },
  { id: 'indonesia', title: 'Indonesia', location: 'Bali', photos: 156, cover: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80' },
  { id: 'spain', title: 'Spain', location: 'Barcelona', photos: 134, cover: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80' },
  { id: 'australia', title: 'Australia', location: 'Sydney', photos: 201, cover: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80' },
  { id: 'uk', title: 'United Kingdom', location: 'London', photos: 178, cover: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80' },
  { id: 'usa', title: 'United States', location: 'New York', photos: 312, cover: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=80' },
];

export const ALBUM_WIDGET_TYPES = new Set(['album_preview', 'album_carousel', 'photo_mosaic']);

export function getAlbumById(id?: string): MockAlbum {
  return MOCK_ALBUMS.find((a) => a.id === id) ?? MOCK_ALBUMS[0];
}
