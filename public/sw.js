
/**
 * MANDI MONITOR - OFFLINE SERVICE WORKER (v1.0)
 * This script caches the app shell on the device to allow 
 * launching from the home screen without internet.
 */

const CACHE_NAME = 'mandi-monitor-standalone-v1';
const OFFLINE_URL = '/';

// 1. Install Phase: Cache the root portal
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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

// 2. Activate Phase: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Phase: Intercept navigations and serve from cache if offline
self.addEventListener('fetch', (event) => {
  // Handle navigation requests (e.g. opening the app)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Handle assets (JS, CSS, Images) with Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache new assets on the fly
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Silent fail for network errors
        return null;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
