// Cache hors-ligne. Change VERSION à chaque mise à jour pour que les téléphones récupèrent les nouveaux fichiers.
const VERSION = 'jourj-v10';
const FILES = [
  './', 'index.html', 'app.css', 'app.js', 'data/questions.json', 'manifest.webmanifest',
  'mentions-legales.html', 'fiches/', 'fiches/index.html', 'fiches/fiches.css', 'fiches/fiches.js', 'fiches/vif.html', 'fiches/chaine.html', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
