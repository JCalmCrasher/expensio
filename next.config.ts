import type { NextConfig } from "next";

// PWA/service worker removed: iOS suspends SW processes in installed PWAs and
// the workbox navigation handler would reject mid-launch, showing Apple's
// "The page couldn't load" screen. public/sw.js is now a self-destroying
// worker that cleans up existing installs.
const nextConfig: NextConfig = {
  turbopack: {},
};

export default nextConfig;
