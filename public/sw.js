const CACHE_NAME = "admin-toolkit-v2";
const PRECACHE_URLS = [
  "/",
  "/404.html",
  "/cidr/",
  "/chmod/",
  "/cron/",
  "/timestamp/",
  "/assets/css/styles.css",
  "/assets/js/config.js",
  "/assets/js/site.js",
  "/assets/js/cidr.js",
  "/assets/js/chmod.js",
  "/assets/js/cron.js",
  "/assets/js/timestamp.js",
  "/assets/icons/icon.svg",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/site.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match("/404.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const update = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || update;
    })
  );
});
