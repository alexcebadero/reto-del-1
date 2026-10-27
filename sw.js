// Service Worker de "El Reto del 1%"
// Estrategia híbrida:
// - Network-first para navegación del documento (index.html)
// - Cache-first para assets estáticos (manifest e iconos)

const CACHE_NAME = 'reto1-v3';
const CORE_ASSETS = [
  './',
  'index.html',
  'share.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) {
    return;
  }

  // Navegación principal del documento: primero red, fallback a caché
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('index.html', responseClone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('index.html');
          if (cached) return cached;
          return caches.match('./');
        })
    );
    return;
  }

  // Assets estáticos de la capa PWA: primero caché, luego red
  const staticAssets = ['share.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
  if (staticAssets.some((asset) => url.pathname.endsWith(asset))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        });
      })
    );
  }
});
