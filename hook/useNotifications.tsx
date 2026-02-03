"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export type NotificationPermission = "default" | "granted" | "denied"

export interface StatusItem {
  id: string
  url: string
  name: string
  status: "up" | "down" | "unknown"
}

export interface UseNotificationsReturn {
  permission: NotificationPermission
  isSupported: boolean
  isEnabled: boolean
  isMonitoring: boolean
  requestPermission: () => Promise<boolean>
  startMonitoring: (statuses: StatusItem[]) => void
  stopMonitoring: () => void
  updateStatuses: (statuses: StatusItem[]) => void
  checkNow: () => void
}

function getInitialSupport() {
  if (typeof window === "undefined") return false
  return "Notification" in window && "serviceWorker" in navigator
}

function getInitialPermission(): NotificationPermission {
  if (typeof window === "undefined") return "default"
  if (!("Notification" in window)) return "default"
  return Notification.permission as NotificationPermission
}

export function useNotifications(
  onStatusUpdate?: (statuses: StatusItem[]) => void,
): UseNotificationsReturn {
  const [permission, setPermission] =
    useState<NotificationPermission>(getInitialPermission)
  const [isSupported] = useState(getInitialSupport)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null)
  const onStatusUpdateRef = useRef(onStatusUpdate)

  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate
  }, [onStatusUpdate])

  useEffect(() => {
    if (!isSupported) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })
        swRegistration.current = registration
        console.log("Service Worker registered:", registration.scope)

        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data.type === "STATUS_UPDATE") {
            onStatusUpdateRef.current?.(event.data.payload.statuses)
          }
        })

        const wasMonitoring =
          localStorage.getItem("statusMonitoring") === "true"
        setIsEnabled(wasMonitoring && Notification.permission === "granted")
        setIsMonitoring(wasMonitoring && Notification.permission === "granted")
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }

    registerSW()

    return () => {}
  }, [isSupported])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn("Notifications not supported")
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result as NotificationPermission)

      if (result === "granted") {
        setIsEnabled(true)
        return true
      }

      return false
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }, [isSupported])

  const startMonitoring = useCallback(
    (statuses: StatusItem[]) => {
      if (!isSupported || !swRegistration.current?.active) {
        console.warn("Service worker not ready")
        return
      }

      swRegistration.current.active.postMessage({
        type: "START_MONITORING",
        payload: { statuses },
      })

      setIsMonitoring(true)
      localStorage.setItem("statusMonitoring", "true")
    },
    [isSupported],
  )

  const stopMonitoring = useCallback(() => {
    if (!swRegistration.current?.active) return

    swRegistration.current.active.postMessage({
      type: "STOP_MONITORING",
    })

    setIsMonitoring(false)
    localStorage.setItem("statusMonitoring", "false")
  }, [])

  const updateStatuses = useCallback((statuses: StatusItem[]) => {
    if (!swRegistration.current?.active) return

    swRegistration.current.active.postMessage({
      type: "UPDATE_STATUSES",
      payload: { statuses },
    })
  }, [])

  const checkNow = useCallback(() => {
    if (!swRegistration.current?.active) return

    swRegistration.current.active.postMessage({
      type: "CHECK_NOW",
    })
  }, [])

  return {
    permission,
    isSupported,
    isEnabled,
    isMonitoring,
    requestPermission,
    startMonitoring,
    stopMonitoring,
    updateStatuses,
    checkNow,
  }
}
