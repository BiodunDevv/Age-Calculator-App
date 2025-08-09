/**
 * Service Worker for Age Calculator PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = "age-calculator-v1.0.0";
const STATIC_CACHE = "age-calculator-static-v1.0.0";
const DYNAMIC_CACHE = "age-calculator-dynamic-v1.0.0";

// Files to cache for offline functionality
const STATIC_FILES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/assets/images/favicon-32x32.png",
  "/assets/images/icon-arrow.svg",
  "/assets/fonts/Poppins-Regular.ttf",
  "/assets/fonts/Poppins-Bold.ttf",
  "/assets/fonts/Poppins-BoldItalic.ttf",
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap",
];

// Network-first resources (always try to get fresh content)
const NETWORK_FIRST = ["/app.js", "/style.css"];

// Cache-first resources (use cache if available)
const CACHE_FIRST = [
  "/assets/",
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

/**
 * Install Event - Cache static files
 */
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Service Worker: Caching static files");
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.error("Service Worker: Error caching static files", error);
      })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            // Delete old caches that don't match current version
            if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Implement caching strategies
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith("http")) {
    return;
  }

  // Handle different caching strategies based on resource type
  if (shouldUseNetworkFirst(request.url)) {
    event.respondWith(networkFirst(request));
  } else if (shouldUseCacheFirst(request.url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function networkFirst(request) {
  try {
    // Try to get from network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Update cache with fresh content
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Service Worker: Network failed, trying cache", request.url);

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cache available, return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/index.html");
    }

    throw error;
  }
}

/**
 * Cache First Strategy
 * Try cache first, fallback to network
 */
async function cacheFirst(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fallback to network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Service Worker: Both cache and network failed", error);
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cache immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  // Always try to update cache in background
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log("Service Worker: Background fetch failed", error);
    });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // If no cache, wait for network
  try {
    return await networkPromise;
  } catch (error) {
    // Return offline fallback for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/index.html");
    }
    throw error;
  }
}

/**
 * Helper Functions
 */
function shouldUseNetworkFirst(url) {
  return NETWORK_FIRST.some((pattern) => url.includes(pattern));
}

function shouldUseCacheFirst(url) {
  return CACHE_FIRST.some((pattern) => url.includes(pattern));
}

/**
 * Background Sync for offline functionality
 */
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered", event.tag);

  if (event.tag === "background-calculation") {
    event.waitUntil(handleBackgroundCalculation());
  }
});

async function handleBackgroundCalculation() {
  // Handle any background calculation tasks
  // This could be used for storing calculation history, etc.
  console.log("Service Worker: Handling background calculation sync");
}

/**
 * Push Notification Support (for future features)
 */
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push event received", event);

  const options = {
    body: event.data ? event.data.text() : "Age Calculator notification",
    icon: "/assets/images/favicon-32x32.png",
    badge: "/assets/images/favicon-32x32.png",
    vibrate: [100, 50, 100],
    actions: [
      {
        action: "open",
        title: "Open Age Calculator",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Age Calculator", options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked", event);

  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // If app is already open, focus it
        for (let client of clientList) {
          if (client.url === self.location.origin && "focus" in client) {
            return client.focus();
          }
        }

        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
    );
  }
});

/**
 * Message Handling (for communication with main app)
 */
self.addEventListener("message", (event) => {
  console.log("Service Worker: Message received", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

/**
 * Clear all caches (for debugging/reset)
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
}

/**
 * Error handling
 */
self.addEventListener("error", (event) => {
  console.error("Service Worker: Error occurred", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("Service Worker: Unhandled promise rejection", event.reason);
});

console.log("Service Worker: Registered successfully");
