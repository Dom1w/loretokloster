const CACHE_NAME = "loretokloster-pwa-93652fa83fd7";
const PRECACHE_URLS = [
  "./",
  "de/",
  "de/375-jahre-gnadenreiches-loretokindlein-in-salzburg.html",
  "de/sitemap.html",
  "en/",
  "en/375-jahre-gnadenreiches-loretokindlein-in-salzburg.html",
  "en/sitemap.html",
  "index.html",
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "static/css/loretokloster.css?v=93652fa83fd7",
  "static/css/main.css?v=93652fa83fd7",
  "static/img/logo.png"
];
const OFFLINE_HTML = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Loretokloster Salzburg</title><style>body{font-family:system-ui,sans-serif;background:#f7f3ee;color:#2a1a14;margin:0;min-height:100vh;display:grid;place-items:center;padding:24px}.card{max-width:38rem;background:#fff;border-radius:20px;padding:24px;box-shadow:0 18px 50px rgba(42,26,20,.12)}h1{margin-top:0}p{line-height:1.6}</style></head><body><div class=\"card\"><h1>Offline</h1><p>This page is not available offline yet. Reconnect and open it once to store it for later.</p></div></body></html>";

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const home = await caches.match('./');
          if (home) return home;
          return new Response(OFFLINE_HTML, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
});
