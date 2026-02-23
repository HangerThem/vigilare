"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  notifyStorageKeyListeners,
  subscribeStorageGlobal,
  subscribeStorageKey,
} from "@/utils/storageListeners"

function readValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback

  try {
    const stored = localStorage.getItem(key)
    return stored === null ? fallback : (JSON.parse(stored) as T)
  } catch {
    return fallback
  }
}

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const fallback = useMemo(() => initialValue, [initialValue])
  const initialJson = useMemo(() => JSON.stringify(initialValue), [initialValue])

  const [value, setValue] = useState<T>(fallback)
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    const refresh = () => {
      const next = readValue(key, fallback)
      valueRef.current = next
      setValue(next)
    }

    const initialSyncTimeout = window.setTimeout(refresh, 0)

    const unsubscribeKey = subscribeStorageKey(key, refresh)
    const unsubscribeGlobal = subscribeStorageGlobal(refresh)

    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) refresh()
    }
    window.addEventListener("storage", onStorage)

    return () => {
      window.clearTimeout(initialSyncTimeout)
      unsubscribeKey()
      unsubscribeGlobal()
      window.removeEventListener("storage", onStorage)
    }
  }, [key, fallback])

  const persist = useCallback(
    (next: T) => {
      if (typeof window === "undefined") return
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch (error) {
        console.error("Failed to save to localStorage:", error)
      }
    },
    [key],
  )

  const setStoredValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const previous = valueRef.current
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(previous) : next

      valueRef.current = resolved
      setValue(resolved)
      persist(resolved)
      notifyStorageKeyListeners(key)
    },
    [key, persist],
  )

  const exportValue = useCallback(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(key)
  }, [key])

  const importValue = useCallback(
    (raw: string) => {
      if (typeof window === "undefined") return
      localStorage.setItem(key, raw)
      notifyStorageKeyListeners(key)

      let nextValue: T
      try {
        nextValue = JSON.parse(raw) as T
      } catch {
        nextValue = JSON.parse(initialJson) as T
      }

      valueRef.current = nextValue
      setValue(nextValue)
    },
    [key, initialJson],
  )

  const clear = useCallback(() => {
    if (typeof window === "undefined") return
    localStorage.removeItem(key)
    notifyStorageKeyListeners(key)
    valueRef.current = fallback
    setValue(fallback)
  }, [key, fallback])

  return {
    value,
    setValue: setStoredValue,
    export: exportValue,
    import: importValue,
    clear,
  } as const
}
