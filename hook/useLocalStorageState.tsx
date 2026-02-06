import { useCallback, useMemo, useSyncExternalStore } from "react"

// Global listeners map for same-window updates
const listeners = new Map<string, Set<() => void>>()

function notifyListeners(key: string) {
  const keyListeners = listeners.get(key)
  if (keyListeners) {
    keyListeners.forEach((callback) => callback())
  }
  // Also notify "all" listeners (for import all functionality)
  const allListeners = listeners.get("__all__")
  if (allListeners) {
    allListeners.forEach((callback) => callback())
  }
}

// Export for use in appData.ts import functionality
export function notifyAllStorageListeners() {
  const allListeners = listeners.get("__all__")
  if (allListeners) {
    allListeners.forEach((callback) => callback())
  }
}

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const subscribe = useCallback(
    (callback: () => void) => {
      // Add to global listeners for same-window updates
      if (!listeners.has(key)) {
        listeners.set(key, new Set())
      }
      listeners.get(key)!.add(callback)

      // Also listen to "__all__" for import functionality
      if (!listeners.has("__all__")) {
        listeners.set("__all__", new Set())
      }
      listeners.get("__all__")!.add(callback)

      // Listen for cross-tab storage events
      const handler = (e: StorageEvent) => {
        if (e.key === key || e.key === null) callback()
      }
      window.addEventListener("storage", handler)

      return () => {
        listeners.get(key)?.delete(callback)
        listeners.get("__all__")?.delete(callback)
        window.removeEventListener("storage", handler)
      }
    },
    [key],
  )

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return JSON.stringify(initialValue)
    }
    try {
      const item = localStorage.getItem(key)
      return item ?? JSON.stringify(initialValue)
    } catch {
      return JSON.stringify(initialValue)
    }
  }, [key, initialValue])

  const getServerSnapshot = useCallback(
    () => JSON.stringify(initialValue),
    [initialValue],
  )

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const value = useMemo(() => {
    try {
      return JSON.parse(raw) as T
    } catch {
      return initialValue
    }
  }, [raw, initialValue])

  const notify = useCallback(() => {
    notifyListeners(key)
  }, [key])

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      if (typeof window === "undefined") return

      const prev = (() => {
        try {
          return JSON.parse(
            localStorage.getItem(key) ?? JSON.stringify(initialValue),
          ) as T
        } catch {
          return initialValue
        }
      })()

      const valueToStore =
        typeof newValue === "function"
          ? (newValue as (p: T) => T)(prev)
          : newValue

      try {
        localStorage.setItem(key, JSON.stringify(valueToStore))
        notify()
      } catch (error) {
        console.error("Failed to save to localStorage:", error)
      }
    },
    [key, initialValue, notify],
  )

  const exportValue = useCallback(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(key)
  }, [key])

  const importValue = useCallback(
    (raw: string) => {
      if (typeof window === "undefined") return
      localStorage.setItem(key, raw)
      notify()
    },
    [key, notify],
  )

  const clear = useCallback(() => {
    if (typeof window === "undefined") return
    localStorage.removeItem(key)
    notify()
  }, [key, notify])

  return {
    value,
    setValue,
    export: exportValue,
    import: importValue,
    clear,
  } as const
}
