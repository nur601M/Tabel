// Service Worker: тиркеме тез ачылсын, телефонго орнотулсун жана Push-эскертмелер келсин үчүн.
// Серверге (Apps Script) болгон суроолор КЭШТЕЛБЕЙТ — алар ар дайым түз барат.
const CACHE = 'tabel-v2';
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

// ---------- Push-эскертмелер ----------
// Сервер бош сигнал жөнөтөт, ал эми тексти бул жерде Бишкектеги убакытка жараша тандалат:
// түшкө чейин — "келгениңизди белгилеңиз", андан кийин — "кеткениңизди белгилеңиз".
self.addEventListener('push', e => {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bishkek', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
  const morning = hour < 12;
  e.waitUntil(
    self.registration.showNotification('Төрт-Гүл айыл өкмөтү', {
      body: morning ? 'Жумушка келгениңизди белгилеңиз' : 'Жумуштан кеткениңизди белгилеңиз',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: morning ? 'tabel-in' : 'tabel-out',
      renotify: true,
      data: { url: './app.html' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.focus();
      return clients.openWindow('./app.html');
    })
  );
});
