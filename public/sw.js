/**
 * MANDI MONITOR - STANDALONE OFFLINE ENGINE
 * This file saves the app code to the phone's memory to allow
 * launching from the home screen with ZERO internet.
 */

const CACHE_NAME = 'mandi-monitor-v8';
const OFFLINE_URL = '/';

// 1. Install: Save core app files to memory
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/manifest.json',
        'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
        'https://placehold.co/180x180/0b3d1e/ffffff.png?text=MILL'
      ]);
    })
  );
  self.skipWaiting();
});

// 2. Activate: Clean up old versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Intercept launch requests and serve from memory
self.addEventListener('fetch', (event) => {
  // Catch navigation requests (opening the app)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Catch asset requests (scripts, styles, icons)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchRes) => {
        // Automatically save new assets to memory as they are loaded
        if (fetchRes.status === 200 && fetchRes.type === 'basic') {
          const resClone = fetchRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return fetchRes;
      }).catch(() => {
        // Silent fallback for images
        if (event.request.destination === 'image') {
          return caches.match('https://placehold.co/32x32/0b3d1e/ffffff.png?text=M');
        }
      });
    })
  );
});
