/* Guarda la app para que abra sin señal.
   Al publicar una versión nueva hay que subir CACHE y VERSION en js/ui.js. */
const CACHE = 'rutaspana-V.10';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './css/app.css',
  './js/vendor/xlsx.full.min.js', './js/config.js', './js/core.js', './js/imagen.js', './js/carpetas.js', './js/ui.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  // Solo borra cachés de esta misma app: las otras apps de Rinze no se tocan.
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('rutaspana-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Primero la red (para recibir siempre la última versión); sin señal, lo guardado.
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then((res) => {
    if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(r, copia)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || caches.match('./index.html'))));
});
