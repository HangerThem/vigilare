"use client"

import { LAST_BACKUP_KEY } from "@/hook/useAutoBackup"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { createContext, useContext, useEffect, useState } from "react"
import { ModalName } from "@/context/ModalContext"
import useIsMac from "@/hook/useIsMac"
import { useToast } from "./ToastContext"
import { icons } from "lucide-react"

export type ShortcutName =
  | "openCommandPalette"
  | "openGlobalSearch"
  | "openShortcuts"
  | "newLink"
  | "newNote"
  | "newSnippet"
  | "newStatus"
  | "openSettings"

type Shortcut = {
  keys: string[]
  designation: string
  modalName: ModalName
}

type Shortcuts = {
  [key in ShortcutName]: Shortcut
}

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

  // Shortcuts
  shortcuts: Shortcuts
}

const defaultShortcuts: Shortcuts = {
  openCommandPalette: {
    keys: ["MOD", "K"],
    designation: "Open Command Palette",
    modalName: "commandPalette",
  },
  openGlobalSearch: {
    keys: ["MOD", "P"],
    designation: "Open Global Search",
    modalName: "globalSearch",
  },
  openShortcuts: {
    keys: ["MOD", "I"],
    designation: "Open Shortcuts",
    modalName: "shortcuts",
  },
  newLink: {
    keys: ["MOD", "L"],
    designation: "New Link",
    modalName: "links",
  },
  newNote: {
    keys: ["MOD", "Shift", "N"],
    designation: "New Note",
    modalName: "notes",
  },
  newSnippet: {
    keys: ["MOD", "Shift", "S"],
    designation: "New Snippet",
    modalName: "snippets",
  },
  newStatus: {
    keys: ["MOD", "S"],
    designation: "New Status",
    modalName: "status",
  },
  openSettings: {
    keys: ["MOD", ","],
    designation: "Open Settings",
    modalName: "settings",
  },
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
  shortcuts: defaultShortcuts,
}

interface SettingsContextType {
  settings: AppSettings
  isDisableShortcuts: boolean
  disableShortcuts: () => void
  enableShortcuts: () => void
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void
  updateShortcut: (shortcutName: ShortcutName, newKeys: string[]) => void
  resetShortcut: (shortcutName: ShortcutName) => void
  resetSettings: () => void
  isShortcutChanged: (shortcutName: ShortcutName) => boolean
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const isMac = useIsMac()
  const { addToast } = useToast()
  const [isDisableShortcuts, setIsDisableShortcuts] = useState(false)
  const platformShortcuts: Shortcuts = Object.fromEntries(
    Object.entries(defaultShortcuts).map(([name, shortcut]) => [
      name,
      {
        ...shortcut,
        keys: shortcut.keys.map((key) =>
          key === "MOD" ? (isMac ? "Meta" : "Ctrl") : key,
        ),
      },
    ]),
  ) as Shortcuts

  useEffect(() => {
    const storedSettings = localStorage.getItem("appSettings")
    if (!storedSettings) {
      localStorage.setItem(
        "appSettings",
        JSON.stringify({
          ...defaultSettings,
          shortcuts: platformShortcuts,
        }),
      )
    }
  }, [platformShortcuts])

  const { value: settings, setValue: setSettings } =
    useLocalStorageState<AppSettings>("appSettings", {
      ...defaultSettings,
      shortcuts: platformShortcuts,
    })
  const { value: lastBackupTimestamp, setValue: setLastBackupTimestamp } =
    useLocalStorageState<number | null>(LAST_BACKUP_KEY, null)

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateShortcut = (shortcutName: ShortcutName, newKeys: string[]) => {
    setSettings((prev) => ({
      ...prev,
      shortcuts: {
        ...prev.shortcuts,
        [shortcutName]: {
          ...prev.shortcuts[shortcutName],
          keys: newKeys,
        },
      },
    }))
  }

  const resetShortcut = (shortcutName: ShortcutName) => {
    const fallback = isMac ? "Meta" : "Ctrl"
    const defaultKeys = defaultShortcuts[shortcutName].keys.map((key) =>
      key === "MOD" ? fallback : key,
    )

    updateShortcut(shortcutName, defaultKeys)
  }

  const isShortcutChanged = (shortcutName: ShortcutName) => {
    const currentKeys = settings.shortcuts[shortcutName].keys
    const defaultKeys = platformShortcuts[shortcutName].keys
    return (
      currentKeys.length !== defaultKeys.length ||
      currentKeys.some((key, index) => key !== defaultKeys[index])
    )
  }

  const resetSettings = () => {
    setSettings({
      ...defaultSettings,
      shortcuts: platformShortcuts,
    })
    addToast({
      message: "Settings have been reset to default",
      icon: icons.Check,
    })
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
      value={{
        settings,
        isDisableShortcuts,
        disableShortcuts: () => setIsDisableShortcuts(true),
        enableShortcuts: () => setIsDisableShortcuts(false),
        updateSetting,
        updateShortcut,
        resetShortcut,
        resetSettings,
        isShortcutChanged,
      }}
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
