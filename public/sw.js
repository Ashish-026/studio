/**
 * MANDI MONITOR - OFFLINE STANDALONE ENGINE (v12)
 * Ensures the app loads from phone memory without a server connection.
 */

const CACHE_NAME = 'mandi-monitor-v12';
const APP_FILES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// 1. INSTALLATION: Save the app code to local phone memory
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_FILES);
    })
  );
  self.skipWaiting();
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

// 3. FETCH INTERCEPTOR: Serve from memory if offline
self.addEventListener('fetch', (event) => {
  // NAVIGATION FALLBACK: If user opens a sub-page while offline, serve the main app
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // STANDARD ASSET CACHING
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
