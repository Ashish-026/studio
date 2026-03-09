
/**
 * MANDI MONITOR - OFFLINE STANDALONE ENGINE
 * Version: 1.0.4 (Definitive)
 */

const CACHE_NAME = 'mandi-monitor-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  'https://placehold.co/32x32/0b3d1e/ffffff.png?text=M',
  'https://placehold.co/180x180/0b3d1e/ffffff.png?text=MILL',
  'https://images.unsplash.com/photo-1595024600400-2a49b9fce270?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx3aGVhdCUyMGZpZWxkfGVufDB8fHx8MTc2MjQ0NzQwNnww&ixlib=rb-4.1.0&q=80&w=1080'
];

// 1. INSTALL: Save the core app files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: The "Detachment" Engine
self.addEventListener('fetch', (event) => {
  // Navigation request strategy: Serve index for any sub-path to prevent 404s
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // General request strategy: Cache-First for assets, Network-Fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache new assets dynamically
        if (fetchResponse.status === 200 && event.request.url.startsWith('http')) {
          const responseClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // Return local fallback if everything fails
      return caches.match('/');
    })
  );
});
