
/**
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE (v1.0)
 * This worker ensures the app opens even when the server is unreachable.
 */

const CACHE_NAME = 'mandi-monitor-v1';
const OFFLINE_URL = '/';

// 1. INSTALL: Cache the root App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([OFFLINE_URL]);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE: Clean up old versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Intercept requests and provide Navigation Fallback
self.addEventListener('fetch', (event) => {
  // NAVIGATION FALLBACK: If a user navigates to a page while offline, serve the root index
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // ASSET CACHING: Stale-while-revalidate for images, CSS, and JS
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
        }
        return networkResponse;
      });
    }).catch(() => {
        // Silent failure for assets that aren't critical
    })
  );
});
