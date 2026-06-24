// public/sw.js
const CACHE_NAME = "smartclinic-v2";

// Only cache static assets — NEVER cache HTML pages
const STATIC_ASSETS = ["/icon-192.png", "/icon-512.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          fetch(asset)
            .then((res) => {
              if (!res.ok)
                throw new Error(`Bad response for ${asset}: ${res.status}`);
              return cache.put(asset, res);
            })
            .catch((err) => {
              console.error("[SW] Failed to cache:", asset, err);
            }),
        ),
      );
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept: HTML pages, API calls, auth routes, Next.js internals
  if (
    request.mode === "navigate" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first only for static assets (images, manifest)
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          // Only cache successful static asset responses
          if (response.ok && STATIC_ASSETS.some((a) => url.pathname === a)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
      );
    }),
  );
});
