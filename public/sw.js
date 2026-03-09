/**
 * MANDI MONITOR - OFFLINE ENGINE
 * This Service Worker caches the application shell to ensure the app
 * remains functional even when the server is offline or unreachable.
 */

const CACHE_NAME = 'mandi-monitor-v2';
const OFFLINE_URL = '/';

// 1. INSTALL: Cache the core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache the root and manifest
      return cache.addAll([
        '/',
        '/manifest.webmanifest',
        'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
        'https://placehold.co/512x512/0b3d1e/ffffff.png?text=MILL'
      ]);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Network-First falling back to Cache
// This strategy ensures we get updates when online but stay working when offline.
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for our own origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, clone it and save to cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the request is for a navigation (page load), return the cached root
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return Promise.reject('Offline and not cached');
        });
      })
  );
});
