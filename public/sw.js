
const CACHE_NAME = 'mandi-monitor-v1';
const OFFLINE_URL = '/';

// Files to cache for a complete standalone experience
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
  'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL'
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

self.addEventListener('fetch', (event) => {
  // NAVIGATION FALLBACK: This is the key fix for 404 errors.
  // If the user navigates to a sub-page (like /dashboard) and the server is offline,
  // we serve the root index page instead of a 404.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Generic asset fetching (cache first, then network)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
