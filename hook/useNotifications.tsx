"use client"

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { useOnline } from "@/hook/useOnline"
import { Status } from "@/types/Status.type"
import { State } from "@/const/State"

export type NotificationPermission = "default" | "granted" | "denied"

export interface UseNotificationsReturn {
  permission: NotificationPermission
  isSupported: boolean
  isMonitoring: boolean
  notificationsEnabled: boolean
  checkInterval: number
  setCheckInterval: (interval: number) => void
  requestPermission: () => Promise<boolean>
  startMonitoring: (statuses: Status[]) => void
  updateStatuses: (statuses: Status[]) => void
  stopMonitoring: () => void
  enableNotifications: () => Promise<boolean>
  disableNotifications: () => void
}

const DEFAULT_CHECK_INTERVAL = 15000

const emptySubscribe = () => () => {}
const getIsSupported = () =>
  "Notification" in window && "serviceWorker" in navigator
const getServerIsSupported = () => false
const getPermission = (): NotificationPermission =>
  "Notification" in window
    ? (Notification.permission as NotificationPermission)
    : "default"
const getServerPermission = (): NotificationPermission => "default"

async function checkStatus(status: Status): Promise<"up" | "down"> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(status.url, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    })

    if (res.ok) {
      clearTimeout(timeoutId)
      return "up"
    }

    return "down"
  } catch {
    return "down"
  }
}

export function useNotifications(
  onStatusUpdate?: (statuses: Status[]) => void,
): UseNotificationsReturn {
  const isOnline = useOnline()

  const isSupported = useSyncExternalStore(
    emptySubscribe,
    getIsSupported,
    getServerIsSupported,
  )
  const permission = useSyncExternalStore(
    emptySubscribe,
    getPermission,
    getServerPermission,
  )

  const [isMonitoring, setIsMonitoring] = useState(false)
  const { value: notificationsEnabled, setValue: setNotificationsEnabled } =
    useLocalStorageState<boolean>("notificationsEnabled", false)
  const { value: checkInterval, setValue: setCheckIntervalState } =
    useLocalStorageState<number>("checkInterval", DEFAULT_CHECK_INTERVAL)
  const notificationsEnabledRef = useRef(notificationsEnabled)

  const swRegistration = useRef<ServiceWorkerRegistration | null>(null)
  const onStatusUpdateRef = useRef(onStatusUpdate)
  const statusesRef = useRef<Status[]>([])
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
        console.log("Service Worker registered with scope:", registration)
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
      status: Status,
      previousState: State,
      newState: Omit<State, "unknown">,
    ) => {
      if (Notification.permission !== "granted") return
      if (!swRegistration.current) return

      const title =
        newState === "up"
          ? `✅ ${status.title} is back online!`
          : `🔴 ${status.title} is down!`

      const body =
        newState === "up"
          ? `${status.title} has recovered and is now accessible.`
          : `${status.title} is no longer responding. Previous status: ${previousState}`

      try {
        await swRegistration.current.showNotification(title, {
          body,
          icon: newState === "up" ? "/icon-success.png" : "/icon-error.png",
          badge: "/badge.png",
          tag: `status-${status.id}`,
          data: { url: status.url },
          requireInteraction: newState === "down",
        })
      } catch (error) {
        console.error("Error showing notification:", error)
      }
    },
    [],
  )

  const performCheck = useCallback(async () => {
    if (!isOnline) {
      console.log("Offline: Skipping status check")
      return
    }

    const statuses = statusesRef.current
    if (!statuses || statuses.length === 0) {
      console.log("No statuses to check")
      return
    }

    const updatedStatuses: Status[] = []

    for (const status of statuses) {
      const newState = await checkStatus(status)
      const previousState = status.state

      if (previousState !== "unknown" && previousState !== newState) {
        if (notificationsEnabledRef.current) {
          await showNotification(status, previousState, newState)
        }
      }

      updatedStatuses.push({
        ...status,
        state: newState,
      })
    }

    statusesRef.current = updatedStatuses
    onStatusUpdateRef.current?.(updatedStatuses)
  }, [showNotification, isOnline])

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
    (statuses: Status[]) => {
      statusesRef.current = statuses

      const wasMonitoring = isMonitoring
      if (!wasMonitoring) {
        setIsMonitoring(true)
        localStorage.setItem("statusMonitoring", "true")
        performCheck()
        console.log(`Started monitoring with ${checkInterval}ms interval`)
      }
    },
    [checkInterval, performCheck, isMonitoring],
  )

  const updateStatuses = useCallback((statuses: Status[]) => {
    statusesRef.current = statuses
  }, [])

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
    updateStatuses,
    stopMonitoring,
    enableNotifications,
    disableNotifications,
  }
}
