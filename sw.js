// Calatrava Tourism PWA Service Worker
const CACHE_VERSION = "v1";
const SHELL_CACHE = `calatrava-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `calatrava-runtime-${CACHE_VERSION}`;

// Core "app shell" — precached on install so public pages work offline immediately.
// admin.html is intentionally excluded.
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/destinations.html",
  "/accommodation.html",
  "/establishments.html",
  "/getting-here.html",
  "/404.html",
  "/assets/emergency.css",
  "/assets/i18n.js",
  "/data/about.json",
  "/data/accommodation.json",
  "/data/activities.json",
  "/data/contact.json",
  "/data/destinations.json",
  "/data/establishments.json",
  "/data/gallery.json",
  "/data/getting-here.json",
  "/data/settings.json",
  "/data/videos.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(SHELL_ASSETS).catch((err) => {
        // Don't let one missing asset block install of everything else
        console.warn("Shell precache: some assets failed to cache", err);
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Never cache the admin dashboard or its data — always go to network
  if (url.pathname.startsWith("/admin")) {
    return;
  }

  // Navigation requests (HTML pages): network-first, fall back to cache, then offline shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/index.html"))
        )
    );
    return;
  }

  // JSON data: network-first so content stays fresh, fall back to cache offline
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Images, fonts, CSS, JS, etc: cache-first, then fetch and store for next time
  if (
    /\.(png|jpg|jpeg|webp|svg|gif|css|js|woff2?|ttf)$/i.test(url.pathname) ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
      })
    );
    return;
  }
});
