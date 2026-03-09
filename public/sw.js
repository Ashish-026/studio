/**
 * MANDI MONITOR - OFFLINE SERVICE WORKER (CORE ENGINE)
 * This file is critical for making the app work without a server.
 * It caches the app shell and intercepts navigation to prevent 404 errors.
 */

const CACHE_NAME = 'mandi-monitor-offline-v3';
const OFFLINE_URL = '/';

const urlsToCache = [
  '/',
  '/manifest.json',
  'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
  'https://placehold.co/180x180/0b3d1e/ffffff.png?text=MILL'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Handle Navigation Requests (Avoid 404 on refresh of /dashboard etc)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network fails, serve the cached index.html (the App Shell)
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // 2. Handle Asset Requests (Images, Scripts, Styles)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache external assets like fonts or icons on the fly
        if (event.request.url.startsWith('http')) {
           const responseToCache = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, responseToCache);
           });
        }
        return networkResponse;
      });
    }).catch(() => {
        // If image fails, you could return a placeholder here
    })
  );
});
