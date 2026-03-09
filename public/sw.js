/**
 * MANDI MONITOR - OFFLINE ENGINE (Service Worker)
 * This script ensures the app works 100% offline without a server.
 */

const CACHE_NAME = 'mandi-monitor-v2';
const OFFLINE_URL = '/';

// 1. INSTALL: Cache essential assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/manifest.json',
        'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
        'https://placehold.co/512x512/0b3d1e/ffffff.png?text=MILL'
      ]);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE: Clean up old caches
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

// 3. FETCH: Network-First with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // For Firebase or external APIs, we don't force cache if network is available
  // But for the main app bundle, we ensure it works offline.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for future offline use
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // If network fails (Server Offline / Airplane Mode), check cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the request is for a page navigation, return the cached root
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});
