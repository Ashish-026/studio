
/**
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE
 * This file is the "brain" that allows the app to work without a server.
 * Once installed on a phone, it intercepts all requests and serves the 
 * app from local memory if the server is suspended or offline.
 */

const CACHE_NAME = 'mandi-monitor-v3';
const APP_ASSETS = [
  '/',
  '/manifest.webmanifest',
  'https://placehold.co/192x192/0b3d1e/ffffff.png?text=MILL',
  'https://placehold.co/512x512/0b3d1e/ffffff.png?text=MILL'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Mandi Monitor: Caching App Shell for Standalone Mode');
      return cache.addAll(APP_ASSETS);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  // STANDALONE NAVIGATION LOGIC:
  // If the user navigates to any page (like /dashboard) and the server is 
  // suspended (returning 404), we catch the error and serve the local cached portal.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.warn('Mandi Monitor: Server offline/suspended. Loading from Phone Memory.');
        return caches.match('/');
      })
    );
    return;
  }

  // STATIC ASSETS LOGIC: Cache-first to ensure instant loading.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
