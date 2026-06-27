const CACHE = 'jp-study-v1';

const PRECACHE = [
  'index.html',
  'app.js',
  'styles.css',
  'course.json',
  'manifest.json',
  'icon.svg',
  'audio/ame_candy.mp3',
  'audio/ame_rain.mp3',
  'audio/hashi_bridge.mp3',
  'audio/hashi_chopsticks.mp3',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // Always use network for Google Fonts (cache dynamically)
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      }))
    );
    return;
  }

  // Only handle requests to our own origin (in app/)
  if (url.origin !== self.location.origin || !url.pathname.startsWith(self.location.pathname.replace('sw.js', ''))) {
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => {
      const fetched = fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      });
      return cached || fetched;
    })
  );
});
