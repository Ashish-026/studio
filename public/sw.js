
/**
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE (v10)
 * This script makes the app 100% server-independent after the first launch.
 */

const CACHE_NAME = 'mandi-monitor-shell-v10';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
  'https://placehold.co/512x512/0b3d1e/ffffff.png?text=MILL'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Mandi Monitor: Storing App Shell in Internal Memory...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // NAVIGATION INTERCEPTOR: Prevents "You are offline" on page load
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // CACHE-FIRST STRATEGY for all other assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
