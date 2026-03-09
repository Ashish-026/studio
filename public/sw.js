
/*
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE
 * This script caches the entire app shell on the device.
 * Once loaded, the app loads from phone memory, not the server.
 */

const CACHE_NAME = 'mandi-monitor-standalone-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
  'https://placehold.co/512x512/0b3d1e/ffffff.png?text=MILL'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Strategy: Cache-First for static assets, Network-Fallback for dynamic
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // If offline and navigating to a page, serve the main portal
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
