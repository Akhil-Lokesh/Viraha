import type { Album } from '@/lib/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:4000';

/** Resolve a (possibly relative) album cover path to an absolute URL, or null when absent. */
export function resolveAlbumCover(coverImage: string | null | undefined): string | null {
  if (!coverImage) return null;
  if (coverImage.startsWith('http')) return coverImage;
  return `${API_BASE}${coverImage}`;
}

/**
 * Pick the album a dashboard album-widget should feature.
 * Honours an explicit `albumId` selection when present, otherwise falls back to the
 * most recent album. Returns null when the user has no albums (caller renders empty state).
 */
export function pickDisplayAlbum(albums: Album[], albumId?: string): Album | null {
  if (albums.length === 0) return null;
  if (albumId) {
    const match = albums.find((a) => a.id === albumId);
    if (match) return match;
  }
  return albums[0];
}

/**
 * Build the ordered set of cover URLs for mosaic/carousel layouts from real albums,
 * starting with the selected album. Albums without a cover are skipped.
 */
export function getAlbumCovers(albums: Album[], albumId?: string): Array<{ id: string; url: string; title: string }> {
  const selected = pickDisplayAlbum(albums, albumId);
  const ordered = selected ? [selected, ...albums.filter((a) => a.id !== selected.id)] : albums;
  return ordered
    .map((a) => {
      const url = resolveAlbumCover(a.coverImage);
      return url ? { id: a.id, url, title: a.title } : null;
    })
    .filter((x): x is { id: string; url: string; title: string } => x !== null);
}

// ── Legacy mock data ─────────────────────────────────────
// Retained only for the widget-catalog-drawer's album-picker preview thumbnails.
// The live dashboard album widgets now render real `useAlbums()` data (see C10).
// TODO(owner: dashboard-catalog lane): replace this picker preview with real albums.

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
