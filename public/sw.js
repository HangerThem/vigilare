/// <reference lib="webworker" />

const CACHE_NAME = "vigilare-v1"
const STATIC_ASSETS = ["/", "manifest.webmanifest"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      )
    }),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone)
            })
          }
          return response
        })
        .catch(() => cached)

      return cached || fetchPromise
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const { action } = event
  const { url } = event.notification.data || {}

  if (action === "open" && url) {
    event.waitUntil(clients.openWindow(url))
  } else if (url) {
    event.waitUntil(clients.openWindow(url))
  }
})

self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()
  const { title, body, url } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      requireInteraction: true,
    }),
  )
})
