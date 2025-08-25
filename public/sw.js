// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
});

self.addEventListener('fetch', (event) => {
  // Por ahora, no hacemos nada con las peticiones, solo dejamos que pasen.
  // Más adelante podemos agregar lógica de caché aquí.
});