import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const r2Url = process.env.NEXT_PUBLIC_R2_URL || '';

// Extract origin only (scheme + host + port) so CSP allows all API subpaths
const apiOrigin = (() => { try { return new URL(apiUrl).origin; } catch { return apiUrl; } })();

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-eval' 'unsafe-inline' api.mapbox.com`,
  `style-src 'self' 'unsafe-inline' api.mapbox.com`,
  `img-src 'self' data: blob: *.mapbox.com *.openfreemap.org images.unsplash.com randomuser.me ${r2Url}`.trim(),
  `connect-src 'self' ${apiOrigin} api.mapbox.com events.mapbox.com *.openfreemap.org maps.googleapis.com *.sentry.io ${r2Url}`.trim(),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
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
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
