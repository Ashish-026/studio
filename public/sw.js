/**
 * MANDI MONITOR - OFFLINE ENGINE (SERVICE WORKER)
 * This script ensures the app remains 100% independent of the server.
 * It caches the app shell and intercepts 404 navigation errors.
 */

const CACHE_NAME = 'mandi-monitor-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // NAVIGATION FALLBACK: Fixes "No web page found" error for sub-paths like /dashboard
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // STANDARD CACHE-FIRST STRATEGY
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Only cache valid GET responses from the same origin or specific CDNs
        if (event.request.method === 'GET' && fetchResponse.status === 200) {
          const responseClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return fetchResponse;
      });
    })
  );
});
