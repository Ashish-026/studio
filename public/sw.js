
const CACHE_NAME = 'mandi-monitor-engine-v1';
const OFFLINE_URL = '/';

// Core assets to cache for instant offline launch
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
  'https://placehold.co/512x512/0b3d1e/ffffff.png?text=MILL'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Mandi Monitor: Engine Installed. Pre-caching assets...');
      return cache.addAll(STATIC_ASSETS);
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
  // We only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Return from cache if found (Cache-First)
      if (cachedResponse) return cachedResponse;

      // 2. Otherwise try network
      return fetch(event.request).then((networkResponse) => {
        // Cache successful internal asset requests
        if (networkResponse && networkResponse.status === 200 && 
           (url.pathname.startsWith('/_next/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.json'))) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 3. OFFLINE FALLBACK: If navigation fails (e.g. 404 or zero net), serve the root
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
