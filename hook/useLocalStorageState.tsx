"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  notifyStorageKeyListeners,
  subscribeStorageGlobal,
  subscribeStorageKey,
} from "@/utils/storageListeners"

function readValue<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function readRawValue(key: string): string | null {
  if (typeof window === "undefined") return null

  return localStorage.getItem(key)
}

export function useLocalStorageState<T>(key: string, initialValue: T) {
  // Keep initial fallback stable for this key to avoid re-subscribing on each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fallback = useMemo(() => initialValue, [key])
  const initialJson = useMemo(() => JSON.stringify(fallback), [fallback])

  const [value, setValue] = useState<T>(fallback)
  const valueRef = useRef(value)
  const rawValueRef = useRef<string | null>(null)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    const refresh = () => {
      const raw = readRawValue(key)
      if (raw === rawValueRef.current) return

      rawValueRef.current = raw
      const next = readValue(raw, fallback)
      valueRef.current = next
      setValue(next)
    }

    rawValueRef.current = null
    refresh()

    const unsubscribeKey = subscribeStorageKey(key, refresh)
    const unsubscribeGlobal = subscribeStorageGlobal(refresh)

    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) refresh()
    }
    window.addEventListener("storage", onStorage)

    return () => {
      unsubscribeKey()
      unsubscribeGlobal()
      window.removeEventListener("storage", onStorage)
    }
  }, [key, fallback])

  const persist = useCallback(
    (next: T) => {
      if (typeof window === "undefined") return

      const raw = JSON.stringify(next)
      rawValueRef.current = raw
      try {
        localStorage.setItem(key, raw)
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

      if (Object.is(previous, resolved)) return

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
      rawValueRef.current = raw
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
    rawValueRef.current = null
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
