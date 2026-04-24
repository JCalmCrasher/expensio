import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    additionalManifestEntries: [],
    runtimeCaching: [
      // Cache HTML pages (app shell) — serves from cache when offline
      {
        urlPattern: /^https?.*(\/|\/app)(\/)?(\?.*)?$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
          },
        },
      },
      // Cache self-hosted fonts from @fontsource (/_next/static/media/)
      {
        urlPattern: /\/_next\/static\/media\/.+\.(woff|woff2|ttf|otf)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-fonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
      // Cache all Next.js static assets (JS, CSS)
      {
        urlPattern: /\/_next\/static\/.+/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
      {
        urlPattern: /\/_next\/image\?.+/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-image",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  // F11 + F12: Security headers — CSP, clickjacking, MIME sniffing, referrer
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // F12: Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // F12: Prevent MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // F12: Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // F12: Restrict browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // F11: Content Security Policy
          // unsafe-inline needed for Tailwind CSS-in-JS and shadcn inline styles
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed by Next.js dev
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
