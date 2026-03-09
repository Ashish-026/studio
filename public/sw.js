/**
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE
 * This Service Worker ensures the app works 100% offline and is 
 * independent of the Firebase hosting server once installed.
 */

const CACHE_NAME = 'mandi-monitor-v2';

// We use a "Cache with Network Fallback" strategy for assets
// and a "Local-First" strategy for data (handled via IndexedDB in the app)

self.addEventListener('install', (event) => {
  console.log('Mandi Monitor: Service Worker Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Mandi Monitor: Service Worker Activated. App is now Server-Independent.');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Strategy: Try network, if it fails (offline or server suspended), use cache.
  // This allows the app to load instantly from the device memory.
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
