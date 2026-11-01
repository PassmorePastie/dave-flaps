// Change this version when you update the game on GitHub Pages.
const CACHE = 'dave-flaps-v1.0';
const FILES = [
  './', './index.html', './style.css', './game.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './assets/dave-wings.webp', './assets/sausage-roll.webp'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
