import { useCallback, useMemo, useSyncExternalStore } from "react"

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) callback()
      }
      window.addEventListener("storage", handler)
      return () => window.removeEventListener("storage", handler)
    },
    [key],
  )

  const getSnapshot = useCallback(() => {
    const item = localStorage.getItem(key)
    return item ?? JSON.stringify(initialValue)
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
    window.dispatchEvent(new StorageEvent("storage", { key }))
  }, [key])

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
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

      localStorage.setItem(key, JSON.stringify(valueToStore))
      notify()
    },
    [key, initialValue, notify],
  )

  const exportValue = useCallback(() => {
    return localStorage.getItem(key)
  }, [key])

  const importValue = useCallback(
    (raw: string) => {
      localStorage.setItem(key, raw)
      notify()
    },
    [key, notify],
  )

  const clear = useCallback(() => {
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
