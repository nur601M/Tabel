// Service Worker: тиркеме тез ачылсын, телефонго орнотулсун жана Push-эскертмелер келсин үчүн.
// Серверге (Apps Script) болгон суроолор КЭШТЕЛБЕЙТ — алар ар дайым түз барат.
const CACHE = 'tabel-v3';
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
// Сервер тексти менен (шифрленген) жөнөтөт: { t: аталышы, b: тексти, g: тег, u: ачылуучу дарек }.
// Текст келбесе (эски жазылуу) — Бишкектеги убакытка жараша стандарттуу эскертме көрсөтүлөт.
self.addEventListener('push', e => {
  let d = null;
  try { d = e.data ? e.data.json() : null; } catch (x) { d = null; }

  let title = 'Төрт-Гүл айыл өкмөтү', body, tag = 'tabel', url = './app.html';
  if (d && d.b) {
    title = d.t || title; body = d.b; tag = d.g || tag; url = d.u || url;
  } else {
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bishkek', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
    const morning = hour < 12;
    body = morning ? 'Жумушка келгениңизди белгилеңиз' : 'Жумуштан кеткениңизди белгилеңиз';
    tag = morning ? 'tabel-in' : 'tabel-out';
  }

  e.waitUntil(
    self.registration.showNotification(title, {
      body, tag, icon: 'icon-192.png', badge: 'icon-192.png', renotify: true, data: { url }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './app.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) {
          c.postMessage({ openMsgs: url.indexOf('#msg') !== -1 });
          return c.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
