
/**
 * MANDI MONITOR - DEFINITIVE OFFLINE SERVICE WORKER
 * This script saves the entire application shell to the phone's memory.
 * It intercepts all requests to prevent "Page Not Found" errors.
 */

const CACHE_NAME = 'mandi-monitor-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
  'https://placehold.co/180x180/0b3d1e/ffffff.png?text=MILL'
];

// 1. INSTALL: Download and store app files
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVATE: Take control of the page immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 3. FETCH: The Engine that stops 404 errors
self.addEventListener('fetch', (event) => {
  // We only care about GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // If it's a navigation request (opening the app or a sub-page)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network fails or server is 404, serve the main app shell from cache
        return caches.match('/');
      })
    );
    return;
  }

  // For assets (JS, CSS, Images), try cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Don't cache if not a successful response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache the new asset for future offline use
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Silent fail for failed asset fetches
      });
    })
  );
});
