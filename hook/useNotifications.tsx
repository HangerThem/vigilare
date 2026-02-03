"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useLocalStorageState } from "./useLocalStorageState"

export type NotificationPermission = "default" | "granted" | "denied"

export interface StatusItem {
  id: string
  url: string
  title: string
  status: "up" | "down" | "unknown"
}

export interface UseNotificationsReturn {
  permission: NotificationPermission
  isSupported: boolean
  isMonitoring: boolean
  notificationsEnabled: boolean
  checkInterval: number
  setCheckInterval: (interval: number) => void
  requestPermission: () => Promise<boolean>
  startMonitoring: (statuses: StatusItem[]) => void
  stopMonitoring: () => void
  enableNotifications: () => Promise<boolean>
  disableNotifications: () => void
}

const DEFAULT_CHECK_INTERVAL = 15000

function getInitialSupport() {
  if (typeof window === "undefined") return false
  return "Notification" in window && "serviceWorker" in navigator
}

function getInitialPermission(): NotificationPermission {
  if (typeof window === "undefined") return "default"
  if (!("Notification" in window)) return "default"
  return Notification.permission as NotificationPermission
}

async function checkStatus(status: StatusItem): Promise<"up" | "down"> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    await fetch(status.url, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
      mode: "no-cors",
    })

    clearTimeout(timeoutId)
    return "up"
  } catch {
    return "down"
  }
}

export function useNotifications(
  onStatusUpdate?: (statuses: StatusItem[]) => void,
): UseNotificationsReturn {
  const [permission, setPermission] =
    useState<NotificationPermission>(getInitialPermission)
  const [isSupported] = useState(getInitialSupport)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const { value: notificationsEnabled, setValue: setNotificationsEnabled } =
    useLocalStorageState<boolean>("notificationsEnabled", false)
  const { value: checkInterval, setValue: setCheckIntervalState } =
    useLocalStorageState<number>("checkInterval", DEFAULT_CHECK_INTERVAL)
  const notificationsEnabledRef = useRef(notificationsEnabled)

  const swRegistration = useRef<ServiceWorkerRegistration | null>(null)
  const onStatusUpdateRef = useRef(onStatusUpdate)
  const statusesRef = useRef<StatusItem[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate
  }, [onStatusUpdate])

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled
  }, [notificationsEnabled])

  useEffect(() => {
    if (!isSupported) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })
        swRegistration.current = registration
        console.log("Service Worker registered for notifications")
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }

    registerSW()
  }, [isSupported])

  const setCheckInterval = useCallback(
    (interval: number) => {
      setCheckIntervalState(interval)
    },
    [setCheckIntervalState],
  )

  const showNotification = useCallback(
    async (
      status: StatusItem,
      previousStatus: "up" | "down" | "unknown",
      newStatus: "up" | "down",
    ) => {
      if (Notification.permission !== "granted") return
      if (!swRegistration.current) return

      const title =
        newStatus === "up"
          ? `✅ ${status.title} is back online!`
          : `🔴 ${status.title} is down!`

      const body =
        newStatus === "up"
          ? `${status.title} has recovered and is now accessible.`
          : `${status.title} is no longer responding. Previous status: ${previousStatus}`

      try {
        await swRegistration.current.showNotification(title, {
          body,
          icon: newStatus === "up" ? "/icon-success.png" : "/icon-error.png",
          badge: "/badge.png",
          tag: `status-${status.id}`,
          data: { url: status.url },
          requireInteraction: newStatus === "down",
        })
      } catch (error) {
        console.error("Error showing notification:", error)
      }
    },
    [],
  )

  const performCheck = useCallback(async () => {
    const statuses = statusesRef.current
    if (!statuses || statuses.length === 0) {
      console.log("No statuses to check")
      return
    }

    console.log(`Checking ${statuses.length} statuses...`)
    const updatedStatuses: StatusItem[] = []

    for (const status of statuses) {
      const newStatus = await checkStatus(status)
      const previousStatus = status.status

      console.log(`${status.title}: ${previousStatus} -> ${newStatus}`)

      if (previousStatus !== "unknown" && previousStatus !== newStatus) {
        console.log(`Status changed for ${status.title}!`)
        if (notificationsEnabledRef.current) {
          console.log(`Sending notification for ${status.title}...`)
          await showNotification(status, previousStatus, newStatus)
        }
      }

      updatedStatuses.push({
        ...status,
        status: newStatus,
      })
    }

    statusesRef.current = updatedStatuses
    onStatusUpdateRef.current?.(updatedStatuses)
  }, [showNotification])

  useEffect(() => {
    if (!isMonitoring) return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(performCheck, checkInterval)
    console.log(`Monitoring interval set to ${checkInterval}ms`)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isMonitoring, checkInterval, performCheck])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn("Notifications not supported")
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result as NotificationPermission)
      return result === "granted"
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      return false
    }
  }, [isSupported])

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (permission !== "granted") {
      const granted = await requestPermission()
      if (!granted) return false
    }
    setNotificationsEnabled(true)
    console.log("Notifications enabled")
    return true
  }, [permission, requestPermission, setNotificationsEnabled])

  const disableNotifications = useCallback(() => {
    setNotificationsEnabled(false)
    console.log("Notifications disabled")
  }, [setNotificationsEnabled])

  const startMonitoring = useCallback(
    (statuses: StatusItem[]) => {
      statusesRef.current = statuses
      setIsMonitoring(true)
      localStorage.setItem("statusMonitoring", "true")

      performCheck()

      console.log(`Started monitoring with ${checkInterval}ms interval`)
    },
    [checkInterval, performCheck],
  )

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsMonitoring(false)
    localStorage.setItem("statusMonitoring", "false")
    console.log("Monitoring stopped")
  }, [])

  return {
    permission,
    isSupported,
    isMonitoring,
    notificationsEnabled,
    checkInterval,
    setCheckInterval,
    requestPermission,
    startMonitoring,
    stopMonitoring,
    enableNotifications,
    disableNotifications,
  }
}
