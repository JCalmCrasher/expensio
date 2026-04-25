import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false, // 🔥 safer for iOS
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    additionalManifestEntries: [],
    // runtimeCaching: [
    //   // Cache self-hosted fonts
    //   {
    //     urlPattern: /\/_next\/static\/media\/.+\.(woff|woff2|ttf|otf)$/i,
    //     handler: "CacheFirst",
    //     options: {
    //       cacheName: "static-fonts",
    //       expiration: {
    //         maxEntries: 20,
    //         maxAgeSeconds: 60 * 60 * 24 * 365,
    //       },
    //     },
    //   },
    //   // Cache Next.js static assets (JS, CSS)
    //   {
    //     urlPattern: /\/_next\/static\/.+/i,
    //     handler: "CacheFirst",
    //     options: {
    //       cacheName: "next-static",
    //       expiration: {
    //         maxEntries: 200,
    //         maxAgeSeconds: 60 * 60 * 24 * 365,
    //       },
    //     },
    //   },
    //   // Cache images
    //   {
    //     urlPattern: /\/_next\/image\?.+/i,
    //     handler: "StaleWhileRevalidate",
    //     options: {
    //       cacheName: "next-image",
    //       expiration: {
    //         maxEntries: 50,
    //         maxAgeSeconds: 60 * 60 * 24 * 30,
    //       },
    //     },
    //   },
    // ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(isProd
            ? [
                {
                  key: "Content-Security-Policy",
                  value: [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline'",
                    "style-src 'self' 'unsafe-inline'",
                    "font-src 'self' data:",
                    "img-src 'self' data: blob:",
                    "connect-src 'self'",
                    "worker-src 'self' blob:",
                    "manifest-src 'self'",
                  ].join("; "),
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);