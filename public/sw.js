
/*
 * MANDI MONITOR - OFFLINE ENGINE (SERVICE WORKER)
 * This script caches the application shell on the device.
 * It intercepts all navigation requests to ensure the app works
 * even when the server is offline or the project is suspended.
 */

const CACHE_NAME = 'mandi-monitor-v2';
const APP_SHELL = '/';

// 1. INSTALL: Save the main app shell to phone memory
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        APP_SHELL,
        '/manifest.json',
        '/DEVELOPMENT_LOG.txt'
      ]);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE: Clear old versions
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

// 3. FETCH: Intercept requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // NAVIGATION PROTECTION:
  // If the phone tries to load a sub-path like /dashboard, 
  // we return the main app shell from the cache.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(APP_SHELL);
      })
    );
    return;
  }

  // ASSET CACHING (Stale-while-revalidate):
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
