// Service Worker: тиркеме тез ачылсын жана телефонго орнотулсун үчүн.
// Серверге (Apps Script) болгон суроолор КЭШТЕЛБЕЙТ — алар ар дайым түз барат.
const CACHE = 'tabel-v1';
const ASSETS = ['./app.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  // Алгач интернеттен (жаңы версия), жок болсо — кэштен
  e.respondWith(
    fetch(r).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(r, copy));
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }))
  );
});
