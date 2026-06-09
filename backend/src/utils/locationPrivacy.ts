/**
 * Location privacy enforcement for posts.
 *
 * Posts carry a `showLocation` flag (default true). When the author has turned
 * it off, exact coordinates must never leave the API for anyone but the author.
 * Coarse fields (locationName/locationCity/locationCountry) stay visible —
 * only the precise lat/lng pair is redacted.
 */

interface LocationRedactable {
  userId: string;
  locationLat: unknown;
  locationLng: unknown;
  showLocation?: boolean;
}

/**
 * Returns a NEW post object with locationLat/locationLng nulled out when the
 * post has showLocation=false and the viewer is not the post owner. Posts that
 * don't carry a showLocation field (older cached shapes) are left untouched.
 */
export function redactPostLocation<T extends LocationRedactable>(
  post: T,
  viewerId: string | null
): T {
  if (post.showLocation !== false) return post;
  if (viewerId !== null && viewerId === post.userId) return post;
  return { ...post, locationLat: null, locationLng: null };
}

/**
 * Convenience wrapper for lists. Returns a new array; untouched posts are
 * passed through by reference (no mutation either way).
 */
export function redactPostsLocation<T extends LocationRedactable>(
  posts: readonly T[],
  viewerId: string | null
): T[] {
  return posts.map((post) => redactPostLocation(post, viewerId));
}
