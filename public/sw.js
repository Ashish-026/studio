
/**
 * MANDI MONITOR - OFFLINE ENGINE (v4)
 * This script allows the app to launch from mobile memory even with NO internet.
 */

const CACHE_NAME = 'mandi-monitor-standalone-v4';
const OFFLINE_URL = '/';

// 1. Install Phase: Download the entire app shell to the phone
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching root shell for server-independent mode');
      return cache.addAll([
        OFFLINE_URL,
        '/manifest.webmanifest',
        'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
        'https://placehold.co/180x180/0b3d1e/ffffff.png?text=MILL'
      ]);
    })
  );
  self.skipWaiting();
});

// 2. Activate Phase: Clean up old versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Phase: Serve files from phone memory first
self.addEventListener('fetch', (event) => {
  // NAVIGATION LOGIC: If the user opens the app, ALWAYS return the cached root portal
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('SW: Serving cached shell while offline');
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // ASSET LOGIC: Serve images, scripts, and styles from local cache
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Silently add new files to cache as the user navigates
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If everything fails, return empty response instead of browser crash
        return new Response('', { status: 404 });
      });
    })
  );
});
