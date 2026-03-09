/**
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE
 * This Service Worker saves the application shell to the phone's memory.
 * Once the app is opened online once, it becomes 100% server-independent.
 */

const CACHE_NAME = 'mandi-monitor-v2';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache the main portal
      return cache.addAll([OFFLINE_URL, '/manifest.json']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // We only intercept navigation and GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return from cache if found, otherwise fetch from network
      return response || fetch(event.request).then((networkResponse) => {
        // Cache successful network responses dynamically
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // FAILSAFE: If network fails (Offline/Server Down), return the main app shell
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
