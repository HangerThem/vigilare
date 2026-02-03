/// <reference lib="webworker" />

const CACHE_NAME = "vigilare-v1"
const CHECK_INTERVAL = 15000

let statusCheckInterval = null

self.addEventListener("message", (event) => {
  const { type, payload } = event.data
  console.log("[SW] Received message:", type, payload)

  switch (type) {
    case "START_MONITORING":
      startMonitoring(payload.statuses)
      break
    case "STOP_MONITORING":
      stopMonitoring()
      break
    case "UPDATE_STATUSES":
      updateStoredStatuses(payload.statuses)
      break
    case "CHECK_NOW":
      checkStatuses()
      break
  }
})

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("vigilare-sw", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("statuses")) {
        db.createObjectStore("statuses", { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains("config")) {
        db.createObjectStore("config", { keyPath: "key" })
      }
    }
  })
}

async function getStoredStatuses() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("statuses", "readonly")
      const store = transaction.objectStore("statuses")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  } catch (error) {
    console.error("Error getting stored statuses:", error)
    return []
  }
}

async function updateStoredStatuses(statuses) {
  try {
    const db = await openDB()
    const transaction = db.transaction("statuses", "readwrite")
    const store = transaction.objectStore("statuses")

    store.clear()

    for (const status of statuses) {
      store.put(status)
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error("Error updating stored statuses:", error)
  }
}

async function checkStatus(status) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(status.url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeoutId)

    return response.ok ? "up" : "down"
  } catch {
    return "down"
  }
}

async function checkStatuses() {
  const statuses = await getStoredStatuses()
  if (!statuses || statuses.length === 0) {
    console.log("[SW] No statuses to check")
    return
  }

  console.log("[SW] Checking", statuses.length, "statuses")
  const changedStatuses = []

  for (const status of statuses) {
    const newStatus = await checkStatus(status)
    const previousStatus = status.status

    console.log(`[SW] ${status.name}: ${previousStatus} -> ${newStatus}`)

    if (previousStatus !== "unknown" && previousStatus !== newStatus) {
      console.log(`[SW] Status changed for ${status.name}! Will notify.`)
      changedStatuses.push({
        ...status,
        previousStatus,
        newStatus,
      })
    }

    status.status = newStatus
  }

  await updateStoredStatuses(statuses)

  for (const changed of changedStatuses) {
    await sendNotification(changed)
  }

  const clients = await self.clients.matchAll()
  for (const client of clients) {
    client.postMessage({
      type: "STATUS_UPDATE",
      payload: { statuses },
    })
  }
}

async function sendNotification(changedStatus) {
  const { name, url, previousStatus, newStatus } = changedStatus

  // Check if we have notification permission
  const permission = await self.registration.pushManager
    .permissionState({ userVisibleOnly: true })
    .catch(() => Notification.permission)
  console.log("[SW] Notification permission:", permission)

  if (permission !== "granted") {
    console.warn(
      "[SW] Notification permission not granted, skipping notification",
    )
    return
  }

  const title =
    newStatus === "up" ? `✅ ${name} is back online!` : `🔴 ${name} is down!`

  const body =
    newStatus === "up"
      ? `${name} has recovered and is now accessible.`
      : `${name} is no longer responding. Previous status: ${previousStatus}`

  const options = {
    body,
    icon: newStatus === "up" ? "/icon-success.png" : "/icon-error.png",
    badge: "/badge.png",
    tag: `status-${changedStatus.id}`,
    data: { url },
    requireInteraction: newStatus === "down",
    actions:
      newStatus === "down"
        ? [
            { action: "check", title: "Check Now" },
            { action: "open", title: "Open URL" },
          ]
        : [{ action: "open", title: "Open URL" }],
  }

  try {
    await self.registration.showNotification(title, options)
    console.log("[SW] Notification shown:", title)
  } catch (error) {
    console.error("Error showing notification:", error)
  }
}

function startMonitoring(statuses) {
  updateStoredStatuses(statuses)

  saveMonitoringState(true)

  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
  }

  statusCheckInterval = setInterval(checkStatuses, CHECK_INTERVAL)

  checkStatuses()

  console.log("Status monitoring started")
}

async function saveMonitoringState(isMonitoring) {
  try {
    const db = await openDB()
    const transaction = db.transaction("config", "readwrite")
    const store = transaction.objectStore("config")
    store.put({ key: "isMonitoring", value: isMonitoring })
  } catch (error) {
    console.error("Error saving monitoring state:", error)
  }
}

function stopMonitoring() {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
    statusCheckInterval = null
  }
  saveMonitoringState(false)
  console.log("Status monitoring stopped")
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const { action } = event
  const { url } = event.notification.data || {}

  if (action === "open" && url) {
    event.waitUntil(clients.openWindow(url))
  } else if (action === "check") {
    event.waitUntil(checkStatuses())
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

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim()
      const db = await openDB()
      const transaction = db.transaction("config", "readonly")
      const store = transaction.objectStore("config")
      const request = store.get("isMonitoring")

      request.onsuccess = async () => {
        if (request.result?.value === true) {
          const statuses = await getStoredStatuses()
          if (statuses && statuses.length > 0) {
            console.log("[SW] Resuming monitoring after activation")
            startMonitoring(statuses)
          }
        }
      }
    })(),
  )
})

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "status-check") {
    event.waitUntil(checkStatuses())
  }
})
