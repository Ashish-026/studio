
/**
 * MANDI MONITOR - DEFINITIVE OFFLINE STANDALONE ENGINE
 * Version: 9.0
 * This script allows the app to launch from scratch without any internet.
 */

const CACHE_NAME = 'mandi-monitor-v9';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
  'https://placehold.co/180x180/0b3d1e/ffffff.png?text=MILL',
  'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
  'https://placehold.co/512x512/0b3d1e/ffffff.png?text=MILL'
];

// 1. INSTALLATION: Save the app code to phone memory
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVATION: Clean up old versions
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

// 3. FETCH INTERCEPTOR: The "True Offline" magic
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for navigation or assets
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NAVIGATION LOGIC: If offline and trying to open the app, serve the main shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // ASSET LOGIC: Cache-First for speed and reliability
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache external assets like fonts/images on the fly
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If everything fails, just return nothing
        return new Response('Offline resource not available', { status: 503 });
      });
    })
  );
});
