/**
 * MANDI MONITOR - OFFLINE STANDALONE ENGINE (v7)
 * This script saves the app logic to the phone's memory.
 */

const CACHE_NAME = 'mandi-monitor-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
  'https://placehold.co/512x512/0b3d1e/ffffff.png?text=MILL'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Navigation Interceptor: Catches "You are offline" and serving local app portal
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
