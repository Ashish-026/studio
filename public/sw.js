
/**
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE (v7)
 * This script saves the app logic to the phone's memory.
 */

const CACHE_NAME = 'mandi-monitor-offline-v7';
const OFFLINE_URL = '/';

// 1. Installation: Save the "App Portal" to the phone
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

// 2. Activation: Clear old versions
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

// 3. Fetch Interceptor: The "Zero Internet" Launcher
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests (opening the app)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If the server is offline or suspended, serve the local copy instantly
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Handle other assets (images, scripts)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
