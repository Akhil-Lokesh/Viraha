/**
 * Location-coordinate utilities shared by the post surfaces
 * (PostCard, PostDetail, profile map tab).
 *
 * Styling lives in `@/lib/design/cinema-tokens` + `@/components/cinema`;
 * this module is purely data logic. The import path keeps its historical
 * name because files outside this feature import from it.
 */

import type { Post } from '@/lib/types';

/**
 * The backend redacts hidden locations by nulling lat/lng while keeping
 * city/country, so coordinates must be guarded before display or map use.
 */
export function getCoordinates(
  lat: number | null,
  lng: number | null
): { lat: number; lng: number } | null {
  if (typeof lat !== 'number' || !Number.isFinite(lat)) return null;
  if (typeof lng !== 'number' || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** A post whose coordinates survived redaction — safe for map markers. */
export type LocatedPost = Post & { locationLat: number; locationLng: number };

/** Type-guard filter for posts that can be plotted on a map. */
export function hasMapCoordinates(post: Post): post is LocatedPost {
  return getCoordinates(post.locationLat, post.locationLng) !== null;
}

/** "47.6062° N, 122.3321° W" — coordinates microlabel text. */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}
