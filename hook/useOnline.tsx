import { useSyncExternalStore } from "react"

const SERVER_SNAPSHOT = () => true

export function useOnline() {
  function subscribeOnlineStatus(callback: () => void) {
    window.addEventListener("online", callback)
    window.addEventListener("offline", callback)
    return () => {
      window.removeEventListener("online", callback)
      window.removeEventListener("offline", callback)
    }
  }

  function getOnlineStatus() {
    return navigator.onLine
  }

  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineStatus,
    SERVER_SNAPSHOT,
  )

  return isOnline
}
