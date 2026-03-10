/**
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE (v9)
 * This script caches the entire app shell to the device's local memory.
 */

const CACHE_NAME = 'mandi-monitor-engine-v9';
const OFFLINE_URL = '/';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
  'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Navigation requests: serve the index shell if offline or error occurs
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // General assets: Cache-First strategy for instant offline boot
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((networkResponse) => {
        // Only cache successful GET requests
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
        }
        return networkResponse;
      }).catch(() => {
        // Return nothing if resource is missing and offline
      });
    })
  );
});
