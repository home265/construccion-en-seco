// public/sw.js

const CACHE_NAME = 'bob-seco-cache-v1';
const urlsToCache = [
  '/',
  '/proyecto',
  '/manifest.webmanifest',
  // Puedes agregar aquí otras rutas o assets importantes que quieras que funcionen offline
];

// Evento de instalación: se dispara cuando el SW se instala
self.addEventListener('install', (event) => {
  // Esperamos a que la promesa de caches.open se resuelva
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de activación: se dispara cuando el SW se activa y limpia cachés viejos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Si este cache no está en nuestra lista blanca, lo borramos
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento fetch: Responde con el caché si está disponible, si no, va a la red
// Este es un manejador simple que prioriza el caché.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si encontramos una respuesta en el caché, la devolvemos
        if (response) {
          return response;
        }
        // Si no, vamos a la red a buscarla
        return fetch(event.request);
      })
  );
});