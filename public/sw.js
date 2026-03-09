/**
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE
 * Version: 5.0
 * This script caches the entire app shell on the device to prevent "Offline" errors at launch.
 */

const CACHE_NAME = 'mandi-monitor-v5';
const OFFLINE_URL = '/';

// 1. INSTALLATION: Save the app shell to local phone storage
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/manifest.webmanifest',
      ]);
    })
  );
});

// 2. ACTIVATION: Claim control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 3. FETCH INTERCEPTION: Serve from memory if network fails
self.addEventListener('fetch', (event) => {
  // Navigation requests (opening the app)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network fails or URL is suspended, serve the local app shell
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Asset requests (JS, CSS, Images)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        // Cache new assets on the fly for permanent offline access
        if (networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
        // Fallback to main shell for any failed asset
        return caches.match(OFFLINE_URL);
    })
  );
});
