/**
 * Utility functions for exporting, importing, downloading, and normalizing application data and settings
 * for the Vigilare app, using localStorage as the data store.
 *
 * @module appDataUtils
 */
import { notifyAllStorageListeners } from "@/hook/useLocalStorageState"

/**
 * The key used for storing settings in localStorage.
 * @constant
 */
const SETTINGS_KEY = "appSettings"
/**
 * The keys used for storing main app data in localStorage.
 * @constant
 */
const DATA_KEYS = ["commands", "links", "notes", "status"]

/**
 * Safely parses a JSON string, returning the original value if parsing fails.
 * @param {string | null} value - The value to parse.
 * @returns {unknown} The parsed value, or the original value if parsing fails.
 */
export function safeParse(value: string | null): unknown {
  if (value === null) return null

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

/**
 * Normalizes a value from string to its appropriate type (boolean, null, object, etc.).
 * @param {unknown} value - The value to normalize.
 * @returns {unknown} The normalized value.
 */
export function normalizeValue(value: unknown): unknown {
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

/**
 * Normalizes all values in an object using normalizeValue.
 * @param {Record<string, unknown>} obj - The object to normalize.
 * @returns {Record<string, unknown>} The normalized object.
 */
export function normalizeObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    normalized[key] = normalizeValue(value)
  }

  return normalized
}

/**
 * Exports all main app data from localStorage as a formatted JSON string.
 * @returns {string} The exported app data as a JSON string.
 */
export function exportAppData(): string {
  const data: Record<string, unknown> = {}

  for (const key of DATA_KEYS) {
    const value = localStorage.getItem(key)
    if (value !== null) {
      data[key] = safeParse(value)
    }
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Exports settings from localStorage as a JSON string.
 * @returns {string} The exported settings as a JSON string.
 */
export function exportSettings(): string {
  const value = localStorage.getItem(SETTINGS_KEY)
  if (value === null) {
    return "{}"
  }
  return value
}

/**
 * Imports app data into localStorage and notifies listeners.
 * @param {Record<string, unknown>} data - The app data to import.
 */
export function importAppData(data: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  notifyAllStorageListeners()
}

/**
 * Imports settings into localStorage, merging with existing settings, and notifies listeners.
 * @param {Record<string, unknown>} data - The settings data to import.
 */
export function importSettings(data: Record<string, unknown>): void {
  const settings = localStorage.getItem(SETTINGS_KEY)
  const currentSettings: Record<string, unknown> = settings
    ? (safeParse(settings) as Record<string, unknown>)
    : {}

  const newSettings = {
    ...currentSettings,
    ...data,
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
  notifyAllStorageListeners()
}

/**
 * Triggers a download of the exported app data as a JSON file.
 * @param {string} [filename="vigilare-backup.json"] - The filename for the downloaded file.
 */
export function downloadAppData(filename: string = "vigilare-backup.json"): void {
  const data = exportAppData()
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

/**
 * Triggers a download of the exported settings as a JSON file.
 * @param {string} [filename="vigilare-settings.json"] - The filename for the downloaded file.
 */
export function downloadSettings(filename: string = "vigilare-settings.json"): void {
  const data = exportSettings()
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

/**
 * Prompts the user to select a JSON file and imports its contents as app data.
 * Reloads the page after successful import.
 */
export function importAppDataFile(): void {
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

        importAppData(normalized)
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

/**
 * Prompts the user to select a JSON file and imports its contents as settings.
 */
export function importSettingsFile(): void {
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

        importSettings(normalized)
      } catch {
        console.error("Invalid Vigilare settings file")
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