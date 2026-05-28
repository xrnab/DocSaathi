const CACHE_SHELL = "docsaathi-shell-v2";
const CACHE_STATIC = "docsaathi-static-v2";
const CACHE_API = "docsaathi-api-v2";
const ALL_CACHES = [CACHE_SHELL, CACHE_STATIC, CACHE_API];

const PRECACHE_PAGES = ["/", "/_offline", "/appointments", "/asha", "/doctors"];
const PRECACHE_STATIC = ["/logo.png", "/banner2.png", "/hero-duo.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_SHELL).then((cache) => {
        console.log("[SW] Precaching pages with bypass load...");
        const pageRequests = PRECACHE_PAGES.map(url => new Request(url, { cache: "reload" }));
        return cache.addAll(pageRequests);
      }),
      caches.open(CACHE_STATIC).then((cache) => {
        console.log("[SW] Precaching static resources...");
        return cache.addAll(PRECACHE_STATIC);
      })
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!ALL_CACHES.includes(key)) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

function fetchWithTimeout(request, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Network timeout")), timeoutMs);
    fetch(request).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip rules
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/sign-in") ||
    url.pathname.startsWith("/sign-up") ||
    url.hostname.includes("clerk")
  ) {
    return;
  }

  // 2. Cache-First (immutable) for Next.js build outputs
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, resClone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 3. Network-First with 5s timeout for specific critical APIs
  if (url.pathname.startsWith("/api/doctors") || url.pathname.startsWith("/api/specialities")) {
    event.respondWith(
      fetchWithTimeout(request, 5000)
        .then((res) => {
          if (res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_API).then((cache) => cache.put(request, resClone));
          }
          return res;
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || new Response(JSON.stringify({ error: "Offline" }), { status: 503, headers: { "Content-Type": "application/json" } }));
        })
    );
    return;
  }

  // 4. Navigate requests (documents) -> Network-First with deep fallbacks
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_SHELL).then((cache) => cache.put(request, resClone));
          }
          return res;
        })
        .catch(() => {
          // Failure cascade: try exact page cached, then try cached "/", then try cached "/_offline"
          return caches.match(request).then((cachedPage) => {
            if (cachedPage) return cachedPage;
            return caches.match("/").then((cachedRoot) => {
              if (cachedRoot) return cachedRoot;
              return caches.match("/_offline");
            });
          });
        })
    );
    return;
  }

  // 5. Stale-While-Revalidate for everything else
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, resClone));
          }
          return res;
        })
        .catch(() => null);

      return cached || fetchPromise;
    })
  );
});

// Sync handler
self.addEventListener("sync", (event) => {
  if (event.tag === "docsaathi-sync") {
    console.log("[SW] Background sync triggered on 'docsaathi-sync'");
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "BACKGROUND_SYNC_TRIGGERED" });
        });
      })
    );
  }
});

// Push handler
self.addEventListener("push", (event) => {
  let data = { title: "DocSaathi Update", body: "Check your dashboard for new updates." };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data = { title: "DocSaathi Update", body: event.data ? event.data.text() : "New update received." };
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo.png",
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
      actions: [
        { action: "open", title: "Open" },
        { action: "dismiss", title: "Dismiss" }
      ]
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
