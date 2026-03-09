/**
 * MANDI MONITOR - OFFLINE ENGINE (Service Worker)
 * This script allows the app to function 100% independently of the server.
 */

const CACHE_NAME = 'mandi-monitor-offline-v3';
const OFFLINE_URL = '/';

// Files to cache immediately on installation
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
  'https://placehold.co/180x180/0b3d1e/ffffff.png?text=MILL'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 1. NAVIGATION REQUESTS (e.g. user opens /dashboard)
  // If the server is offline, we return the cached Root Page (/)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // 2. ASSET REQUESTS (scripts, images, styles)
  // We try the cache first, then the network.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Fallback for failed network requests
        return null;
      });
    })
  );
});
