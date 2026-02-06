import { notifyAllStorageListeners } from "@/hook/useLocalStorageState"

export function exportAllAppData(): string {
  const data: Record<string, unknown> = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) ?? "null")
      } catch {
        data[key] = localStorage.getItem(key)
      }
    }
  }

  return JSON.stringify(data, null, 2)
}

export function importAllAppData(jsonString: string): void {
  const data = JSON.parse(jsonString) as Record<string, unknown>

  localStorage.clear()

  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  // Notify all listeners about the import
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
