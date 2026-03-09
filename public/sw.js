const CACHE_NAME = 'mandi-monitor-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Navigation Interceptor: Serves the app shell for any sub-path to prevent 404s
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // Standard caching for other assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          // Dynamic caching for new assets
          if (fetchResponse.status === 200 && fetchResponse.type === 'basic') {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return fetchResponse;
        });
      })
  );
});
