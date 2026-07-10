import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  customWorkerSrc: "worker",
  // App Router + iOS Safari: aggressive nav caching breaks RSC payloads and
  // causes installed PWAs to show "The page couldn't load".
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  // Only cache static assets — let navigations and API/RSC requests hit the network.
  extendDefaultRuntimeCaching: false,
  workboxOptions: {
    disableDevLogs: true,
    navigateFallback: undefined,
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkOnly",
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
        handler: "NetworkOnly",
      },
      {
        urlPattern: /\/_next\/static\/media\/.+\.(woff|woff2|ttf|otf)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-fonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
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
};

export default withPWA(nextConfig);
