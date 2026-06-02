import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const r2Url = process.env.NEXT_PUBLIC_R2_URL || '';

// Extract origin only (scheme + host + port) so CSP allows all API subpaths
const apiOrigin = (() => { try { return new URL(apiUrl).origin; } catch { return apiUrl; } })();

// Parse the R2 public host so next/image can optimize images served from it.
const r2Hostname = (() => {
  if (!r2Url) return '';
  try { return new URL(r2Url).hostname; } catch { return ''; }
})();

// Allow the configured R2 host explicitly, plus the Cloudflare R2 public dev domains
// (*.r2.dev and pub-*.r2.dev) as sensible fallbacks when the env var is not set.
const r2RemotePatterns: ReadonlyArray<RemotePattern> = [
  ...(r2Hostname ? [{ protocol: 'https', hostname: r2Hostname } as RemotePattern] : []),
  { protocol: 'https', hostname: '*.r2.dev' },
  { protocol: 'https', hostname: 'pub-*.r2.dev' },
];

const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-eval' removed: maplibre-gl v5 does not require eval. 'unsafe-inline' kept
  // until a nonce middleware pipeline exists (Next injects inline bootstrap scripts).
  `script-src 'self' 'unsafe-inline' api.mapbox.com`,
  `style-src 'self' 'unsafe-inline' api.mapbox.com`,
  `img-src 'self' data: blob: *.mapbox.com *.openfreemap.org images.unsplash.com randomuser.me ${r2Url}`.trim(),
  `connect-src 'self' ${apiOrigin} api.mapbox.com events.mapbox.com *.openfreemap.org maps.googleapis.com *.sentry.io ${r2Url}`.trim(),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      ...r2RemotePatterns,
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspDirectives },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
});
