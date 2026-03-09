/**
 * MANDI MONITOR - OFFLINE STANDALONE ENGINE
 * This Service Worker saves the entire app shell to the mobile device.
 * It intercepts 404 errors from suspended servers and serves the local app instead.
 */

const CACHE_NAME = 'mandi-monitor-v2';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// 1. INSTALL: Save the core app to phone memory
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
});

// 2. ACTIVATE: Clean up old versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

// 3. FETCH: The 404/Offline Interceptor
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // NAVIGATION REQUESTS (Opening the app or clicking links)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If server is 404 or offline, serve the local App Portal from memory
        return caches.match('/');
      })
    );
    return;
  }

  // STATIC ASSETS (JS, CSS, Images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Cache new static assets on the fly
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback for assets
        return caches.match('/');
      });
    })
  );
});
