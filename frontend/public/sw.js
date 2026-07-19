// Scorred — lean PWA service worker (P-03).
// Goal: installable app-shell + a branded offline page. NO web-push, NO caching
// of API data or page HTML (avoids stale content — the Expo app owns push/native).
// Strategy:
//   • navigations      → network-first, fall back to /offline.html when offline
//   • immutable static → cache-first (/_next/static/, /brand/, icons, offline page)
//   • everything else  → passthrough (default browser fetch)

const VERSION = "scorred-v1";
const PRECACHE = VERSION + "-precache";
const RUNTIME = VERSION + "-runtime";

const PRECACHE_URLS = [
  "/offline.html",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isImmutableStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname === "/offline.html" ||
    /^\/(icon-.*|apple-touch-icon)\.png$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // App-shell navigations: network-first, offline → branded offline page.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // Immutable static assets: cache-first, populate on first hit.
  if (sameOrigin && isImmutableStatic(url)) {
    event.respondWith(
      caches.open(RUNTIME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const resp = await fetch(request);
        if (resp && resp.ok) cache.put(request, resp.clone());
        return resp;
      })
    );
    return;
  }

  // Everything else (API/data, cross-origin): let the browser handle it.
});
