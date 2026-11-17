/**
 * Backend storage returns relative `/uploads/...` paths on deploys without R2;
 * the browser must fetch those from the API host, not the Next.js host.
 * Absolute URLs (R2, CDNs, seed photos) and in-browser previews pass through.
 */
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(
  /\/api\/v1\/?$/,
  '',
);

const ABSOLUTE_URL = /^(https?:|blob:|data:)/;

export function resolveMediaUrl(path: string): string;
export function resolveMediaUrl(path: string | null | undefined): string | undefined;
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return ABSOLUTE_URL.test(path) ? path : `${API_ORIGIN}${path}`;
}
