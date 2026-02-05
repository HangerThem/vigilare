"use client"

import { LAST_BACKUP_KEY } from "@/hook/useAutoBackup"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { createContext, useContext, useEffect } from "react"

export interface AppSettings {
  // Appearance
  compactMode: boolean
  showAnimations: boolean
  panelOrder: ("links" | "notes" | "commands" | "status")[]

  // Behavior
  confirmBeforeDelete: boolean
  openLinksInNewTab: boolean

  // Status Panel
  showOfflineIndicator: boolean

  // Search
  fuzzySearchThreshold: number // 0-1

  // Data
  maxItemsPerPanel: number // 0 = unlimited
  autoBackupEnabled: boolean
  autoBackupIntervalDays: number
}

const defaultSettings: AppSettings = {
  compactMode: false,
  showAnimations: true,
  panelOrder: ["links", "notes", "commands", "status"],
  confirmBeforeDelete: true,
  openLinksInNewTab: true,
  showOfflineIndicator: true,
  fuzzySearchThreshold: 0.3,
  maxItemsPerPanel: 0,
  autoBackupEnabled: false,
  autoBackupIntervalDays: 7,
}

interface SettingsContextType {
  settings: AppSettings
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { value: settings, setValue: setSettings } =
    useLocalStorageState<AppSettings>("appSettings", defaultSettings)
  const { value: lastBackupTimestamp, setValue: setLastBackupTimestamp } =
    useLocalStorageState<number | null>(LAST_BACKUP_KEY, null)

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  useEffect(() => {
    if (!settings.autoBackupEnabled) {
      setLastBackupTimestamp(null)
    } else if (settings.autoBackupEnabled && lastBackupTimestamp === null) {
      setLastBackupTimestamp(Date.now())
    }
  }, [settings.autoBackupEnabled, lastBackupTimestamp, setLastBackupTimestamp])

  return (
    <SettingsContext.Provider
      value={{ settings, updateSetting, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
