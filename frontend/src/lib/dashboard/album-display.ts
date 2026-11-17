import type { Album } from '@/lib/types';
import { resolveMediaUrl } from '@/lib/media-url';

/** Absolute album cover URL, or null when the album has no cover. */
export function resolveAlbumCover(coverImage: string | null | undefined): string | null {
  return resolveMediaUrl(coverImage) ?? null;
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

export const ALBUM_WIDGET_TYPES = new Set(['album_preview', 'album_carousel', 'photo_mosaic']);
