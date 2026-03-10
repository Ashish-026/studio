
/**
 * MANDI MONITOR - DEFINITIVE OFFLINE ENGINE (v10)
 * This script intercepts "You are offline" browser errors and serves the 
 * cached app shell instantly. It makes the app 100% server-independent.
 */

const CACHE_NAME = 'mandi-monitor-shell-v10';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
  'https://placehold.co/512x512/0b3d1e/ffffff.png?text=MILL'
];

// 1. INSTALL: Force the browser to save the app shell logic
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVATE: Clean up old engines
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

// 3. FETCH: Intercept "Offline" errors and serve local code
self.addEventListener('fetch', (event) => {
  // Only intercept navigation and core assets
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(() => {
      // If everything fails (no network + not in cache), return the root
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});
