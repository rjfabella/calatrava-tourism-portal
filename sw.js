// Calatrava Tourism PWA Service Worker
const CACHE_VERSION = "v2";
const SHELL_CACHE = `calatrava-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `calatrava-runtime-${CACHE_VERSION}`;

// Core "app shell" — precached on install so all public pages work offline immediately.
// admin.html is intentionally excluded.
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/destinations.html",
  "/accommodation.html",
  "/establishments.html",
  "/getting-here.html",
  "/activities.html",
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

// External CDN resources to pre-cache (fonts, etc.)
// These are cached on first visit via the fetch handler below,
// but listing critical ones here ensures they're available immediately.
const CDN_ASSETS = [
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap"
];

// ─── INSTALL ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      // Cache local shell assets one by one so a single missing file
      // doesn't block the entire install
      caches.open(SHELL_CACHE).then((cache) =>
        Promise.allSettled(
          SHELL_ASSETS.map((url) =>
            cache.add(url).catch((err) =>
              console.warn(`[SW] Failed to precache: ${url}`, err)
            )
          )
        )
      ),
      // Cache CDN assets into runtime cache
      caches.open(RUNTIME_CACHE).then((cache) =>
        Promise.allSettled(
          CDN_ASSETS.map((url) =>
            cache.add(new Request(url, { mode: "cors" })).catch((err) =>
              console.warn(`[SW] Failed to precache CDN: ${url}`, err)
            )
          )
        )
      ),
    ])
  );
  self.skipWaiting();
});

// ─── ACTIVATE ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Never cache admin — always live network
  if (url.pathname.startsWith("/admin")) return;

  // Skip Google Maps API requests — they can't be meaningfully cached
  if (
    url.hostname.includes("maps.googleapis.com") ||
    url.hostname.includes("maps.gstatic.com")
  ) {
    return;
  }

  // ── Google Fonts: cache-first (they rarely change) ──────────────────────
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── HTML pages (navigation): network-first → cache → offline fallback ───
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html") || caches.match("/index.html"))
        )
    );
    return;
  }

  // ── JSON data files: network-first → cached fallback ────────────────────
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ── Images: cache-first, network fallback, then placeholder ─────────────
  if (/\.(png|jpg|jpeg|webp|svg|gif|ico)$/i.test(url.pathname)) {
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
          .catch(() => {
            // Return a transparent 1×1 PNG as placeholder for missing images
            return new Response(
              atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
              { headers: { "Content-Type": "image/png" } }
            );
          });
      })
    );
    return;
  }

  // ── CSS, JS, fonts: cache-first, network fallback ───────────────────────
  if (/\.(css|js|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Everything else: network-first, cache fallback ───────────────────────
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
