// Self-destroying service worker.
//
// iOS Safari fetches this file for updates on every PWA launch, even when the
// page itself fails with "The page couldn't load". Because this file differs
// byte-for-byte from the old workbox worker, iOS installs it in the
// background, it takes over immediately, wipes every cache, unregisters
// itself, and reloads any open windows. After that, launches hit the network
// directly with no service worker involved.
//
// Keep this file served at /sw.js until all installed clients have launched
// the app at least once.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        // Cache cleanup is best-effort; unregistering is what matters.
      }
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});

// Intentionally NO fetch handler: navigations pass straight through to the
// network, so this worker can never block a page load.
