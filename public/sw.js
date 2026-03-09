
/**
 * MANDI MONITOR - OFFLINE SERVICE WORKER
 * This worker caches the application locally so it works even if the 
 * Firebase project is closed or the server is offline.
 */

const CACHE_NAME = 'mandi-monitor-cache-v1';
const OFFLINE_URL = '/';

// 1. Install & Cache Essential Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/manifest.webmanifest',
        'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL'
      ]);
    })
  );
  self.skipWaiting();
});

// 2. Activate & Clear Old Caches
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
});

// 3. Fetch Strategy: Stale-While-Revalidate
// Try to serve from cache first for instant speed, then update cache from network in background.
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like firestore APIs) if they fail, don't break the app
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update cache if we got a valid response
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // If network fails (Server closed), we already returned cachedResponse or it's null
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
