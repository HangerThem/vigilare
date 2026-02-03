/// <reference lib="webworker" />

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

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})
