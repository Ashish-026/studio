/**
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE (v5)
 * This file saves the app code to the phone's memory to allow
 * startup without internet or when the server is offline.
 */

const CACHE_NAME = 'mandi-monitor-shell-v5';
const OFFLINE_URL = '/';

// 1. PRE-CACHE: Save essential files on installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
        'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL'
      ]);
    })
  );
  self.skipWaiting();
});

// 2. CLEANUP: Remove old versions of the app
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// 3. OFFLINE INTERCEPTOR: Serve the app from phone memory if server fails
self.addEventListener('fetch', (event) => {
  // Navigation requests (launching the app)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // General assets (scripts, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    })
  );
});
