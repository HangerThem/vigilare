import { notifyAllStorageListeners } from "@/hook/useLocalStorageState"
import { deflate, inflate } from "pako"

function safeParse(value: string | null): unknown {
  if (value === null) return null

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function normalizeValue(value: unknown): unknown {
  if (typeof value !== "string") return value

  if (value === "true") return true
  if (value === "false") return false
  if (value === "null") return null

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function normalizeObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    normalized[key] = normalizeValue(value)
  }

  return normalized
}

function uint8ToBase64(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8))
}

function base64ToUint8(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

export function exportAllAppData(): string {
  const data: Record<string, unknown> = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    data[key] = safeParse(localStorage.getItem(key))
  }

  return JSON.stringify(data, null, 2)
}

export function importAllAppData(data: Record<string, unknown>): void {
  localStorage.clear()

  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  notifyAllStorageListeners()
}

export function downloadAppData(filename = "vigilare-backup.json"): void {
  const data = exportAllAppData()
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

export function importAppData(): void {
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.accept = ".json"

  fileInput.onchange = () => {
    const file = fileInput.files?.[0]
    if (!file) {
      fileInput.remove()
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const raw = JSON.parse(text)
        const normalized = normalizeObject(raw)

        importAllAppData(normalized)
        window.location.reload()
      } catch {
        console.error("Invalid Vigilare backup file")
      } finally {
        fileInput.remove()
      }
    }

    reader.onerror = () => {
      console.error("Failed to read file")
      fileInput.remove()
    }

    reader.readAsText(file)
  }

  fileInput.click()
}

export function exportState(data: Record<string, unknown>): string {
  const json = JSON.stringify(data)
  const compressed = deflate(json)
  return uint8ToBase64(compressed)
}

export function importAppDataFromEncoded(encoded: string): void {
  try {
    const bytes = base64ToUint8(encoded)
    const json = inflate(bytes, { to: "string" })
    const raw = JSON.parse(json)
    const normalized = normalizeObject(raw)

    console.log("Decoded & normalized data:", normalized)

    importAllAppData(normalized)
    window.location.reload()
  } catch (err) {
    console.error("Invalid encoded Vigilare payload", err)
  }
}
