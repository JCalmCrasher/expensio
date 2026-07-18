import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

/**
 * PWA must stay asset-only for App Router.
 * Intercepting navigations / RSC (even with NetworkOnly) is a known cause of
 * iOS Safari / installed PWA showing "This page couldn't load" on /app while / works.
 */
const withPWA = withPWAInit({
  dest: "public",
  customWorkerSrc: "worker",
  disable: process.env.NODE_ENV === "development",
  // We register manually (and skip entirely on iOS) — see RegisterServiceWorker.
  register: false,
  // Do not precache or NetworkFirst the start URL — App Router HTML must
  // always come from the network (dynamicStartUrl adds a "/" NetworkFirst route).
  cacheStartUrl: false,
  dynamicStartUrl: false,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  extendDefaultRuntimeCaching: false,
  // Don't precache the landing video (huge) or SW artifacts.
  publicExcludes: ["!landing.mp4", "!sw.js", "!sw.js.map", "!workbox-*.js", "!workbox-*.js.map"],
  workboxOptions: {
    disableDevLogs: true,
    // No offline document fallback — App Router HTML must always hit the network.
    navigateFallback: undefined,
    runtimeCaching: [
      // Next.js Flight / RSC — never cache, never specially intercept beyond network.
      {
        urlPattern: ({ request }) =>
          request.headers.get("RSC") === "1" ||
          request.headers.get("Next-Router-State-Tree") != null ||
          request.headers.get("Next-Router-Prefetch") != null ||
          (request.headers.get("Accept") ?? "").includes("text/x-component"),
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
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
      // Prefer network after deploys so chunk hash mismatches don't stick on iOS.
      {
        urlPattern: /\/_next\/static\/.+/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "next-static",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 7,
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
      {
        urlPattern: ({ request }) =>
          request.destination === "image" || request.destination === "audio",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-media",
          expiration: {
            maxEntries: 64,
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
