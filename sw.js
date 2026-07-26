const CACHE_NAME = "admin-toolkit-v1";
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
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/404.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
