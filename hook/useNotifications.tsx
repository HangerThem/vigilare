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
import { checkStatus } from "@/utils/status"

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

const DEFAULT_CHECK_INTERVAL = 60000

const emptySubscribe = () => () => {}
const getIsSupported = () =>
  "Notification" in window && "serviceWorker" in navigator
const getServerIsSupported = () => false
const getPermission = (): NotificationPermission =>
  "Notification" in window
    ? (Notification.permission as NotificationPermission)
    : "default"
const getServerPermission = (): NotificationPermission => "default"

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
  const isCheckingRef = useRef(false)

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
    if (isCheckingRef.current) return

    if (!isOnline) {
      console.log("Offline: Skipping status check")
      return
    }

    const statusesAtStart = statusesRef.current
    if (!statusesAtStart || statusesAtStart.length === 0) {
      console.log("No statuses to check")
      return
    }

    const checkables = statusesAtStart
      .filter((status) => status.enabled)
      .map((status) => checkStatus(status))

    if (checkables.length === 0) return

    isCheckingRef.current = true
    try {
      const checkResults = await Promise.all(checkables)
      const statusesNow = statusesRef.current
      const updatesById = new Map<
        string,
        { state: "up" | "down"; responseTime: number; lastChecked: string }
      >()

      for (const results of checkResults) {
        const { id, state, responseTime } = results
        const currentStatus = statusesNow.find((s) => s.id === id)
        if (!currentStatus) continue

        if (currentStatus.state !== state && notificationsEnabledRef.current) {
          void showNotification(currentStatus, currentStatus.state, state)
        }

        updatesById.set(id, {
          state,
          responseTime,
          lastChecked: new Date().toISOString(),
        })
      }

      if (updatesById.size === 0) return

      const nextStatuses = statusesNow.map((status) => {
        const statusUpdates = updatesById.get(status.id)
        return statusUpdates ? { ...status, ...statusUpdates } : status
      })

      statusesRef.current = nextStatuses
      onStatusUpdateRef.current?.(nextStatuses)
    } finally {
      isCheckingRef.current = false
    }
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
