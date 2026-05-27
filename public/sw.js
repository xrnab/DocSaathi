// DocSaathi Progressive Web App Service Worker
const CACHE_NAME = "docsaathi-cache-v1";

// Essential assets to cache on install for offline boot
const PRECACHE_ASSETS = [
  "/",
  "/logo.png",
  "/banner2.png",
  "/hero-duo.png"
];

// Install listener - pre-cache static layout shell & core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching core layout shell");
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate listener - clean up legacy caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch listener - intercept and serve cached assets or fetch fresh copies
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Bypass rules: Only cache GET requests, and ignore Chrome extensions, Clerk auth, and api calls
  if (
    request.method !== "GET" ||
    !request.url.startsWith("http") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/sign-in") ||
    url.pathname.startsWith("/sign-up") ||
    url.hostname.includes("clerk")
  ) {
    return; // Fallback directly to native browser fetch
  }

  // 2. Navigation Requests (Main Pages / Documents) -> Network-First, Fallback to Cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Put a copy of the fresh page in the cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, serve the cached index shell page `/`
          return caches.match("/").then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Or return match for specific subpage if cached
            return caches.match(request);
          });
        })
    );
    return;
  }

  // 3. Static Resources (CSS, Chunks, JS, Fonts, Images) -> Cache-First, Fallback to Network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch static assets in background to keep cache up to date (stale-while-revalidate)
        fetch(request)
          .then((response) => {
            if (response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
            }
          })
          .catch(() => {}); // Ignore network errors during background update
        
        return cachedResponse;
      }

      // If not in cache, fetch from network and add to cache dynamically
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});
