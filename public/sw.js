
/**
 * MANDI MONITOR - DEFINITIVE OFFLINE ENGINE (v8)
 * Strategy: Cache-First for Assets, Network-First for Navigation with Offline Fallback.
 */

const CACHE_NAME = 'mandi-monitor-v8';
const ASSETS = [
  '/',
  '/manifest.json',
  'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
  'https://placehold.co/180x180/0b3d1e/ffffff.png?text=MILL'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // NAVIGATION REQUESTS: Always try to serve the root shell if offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // ASSET REQUESTS: Cache-First
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        // Don't cache firebase/analytics calls
        if (event.request.url.includes('googleapis') || event.request.url.includes('firebase')) {
          return networkResponse;
        }
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    }).catch(() => {
      // Return a blank response for failed assets if offline
      return new Response('');
    })
  );
});
