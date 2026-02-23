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

export const PANEL_KEYS = ["links", "notes", "snippets", "status"] as const
export type PanelKey = (typeof PANEL_KEYS)[number]
export type LayoutPreset =
  | "quad"
  | "focusLeft"
  | "focusRight"
  | "singleColumn"
  | "custom"
export type CustomLayout = {
  columns: 1 | 2 | 3
  focusPanel: PanelKey | null
}
export type PanelVisibility = Record<PanelKey, boolean>

type LayoutSettings = Pick<
  AppSettings,
  "layoutPreset" | "panelOrder" | "panelVisibility" | "customLayout"
>

export interface AppSettings {
  // Appearance
  compactMode: boolean
  showAnimations: boolean
  layoutPreset: LayoutPreset
  customLayout: CustomLayout
  panelOrder: PanelKey[]
  panelVisibility: PanelVisibility

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

const defaultPanelVisibility: PanelVisibility = {
  links: true,
  notes: true,
  snippets: true,
  status: true,
}

const defaultCustomLayout: CustomLayout = {
  columns: 2,
  focusPanel: null,
}

const defaultSettings: AppSettings = {
  compactMode: false,
  showAnimations: true,
  layoutPreset: "quad",
  customLayout: { ...defaultCustomLayout },
  panelOrder: [...PANEL_KEYS],
  panelVisibility: defaultPanelVisibility,
  confirmBeforeDelete: true,
  openLinksInNewTab: true,
  showOfflineIndicator: true,
  fuzzySearchThreshold: 0.3,
  maxItemsPerPanel: 0,
  autoBackupEnabled: false,
  autoBackupIntervalDays: 7,
  shortcuts: defaultShortcuts,
}

const defaultLayoutSettings: LayoutSettings = {
  layoutPreset: defaultSettings.layoutPreset,
  customLayout: { ...defaultSettings.customLayout },
  panelOrder: [...defaultSettings.panelOrder],
  panelVisibility: { ...defaultSettings.panelVisibility },
}

const LAYOUT_PRESETS: LayoutPreset[] = [
  "quad",
  "focusLeft",
  "focusRight",
  "singleColumn",
  "custom",
]

export const isValidPanelKey = (value: unknown): value is PanelKey =>
  typeof value === "string" && PANEL_KEYS.includes(value as PanelKey)

export const normalizePanelOrder = (
  value: unknown,
  defaults: PanelKey[],
): PanelKey[] | null => {
  if (!Array.isArray(value)) return null
  if (value.length !== PANEL_KEYS.length) return null
  if (value.some((panel) => !isValidPanelKey(panel))) return null

  const uniquePanels = new Set(value)
  if (uniquePanels.size !== PANEL_KEYS.length) return null
  if (PANEL_KEYS.some((panel) => !uniquePanels.has(panel))) return null

  const normalized = value as PanelKey[]
  return normalized.length === defaults.length ? normalized : null
}

export const normalizePanelVisibility = (
  value: unknown,
  _defaults: PanelVisibility,
): PanelVisibility | null => {
  void _defaults

  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const candidate = value as Record<string, unknown>
  const normalized: Partial<PanelVisibility> = {}

  for (const panel of PANEL_KEYS) {
    if (typeof candidate[panel] !== "boolean") return null
    normalized[panel] = candidate[panel] as boolean
  }

  for (const key of Object.keys(candidate)) {
    if (!isValidPanelKey(key)) return null
  }

  return PANEL_KEYS.every((panel) => panel in normalized)
    ? (normalized as PanelVisibility)
    : null
}

export const normalizeCustomLayout = (value: unknown): CustomLayout | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const candidate = value as Record<string, unknown>
  const validColumns =
    candidate.columns === 1 ||
    candidate.columns === 2 ||
    candidate.columns === 3
  const validFocusPanel =
    candidate.focusPanel === null || isValidPanelKey(candidate.focusPanel)

  if (!validColumns || !validFocusPanel) return null

  return {
    columns: candidate.columns as 1 | 2 | 3,
    focusPanel: candidate.focusPanel as PanelKey | null,
  }
}

export const normalizeLayoutSettings = (
  raw: unknown,
  defaults: LayoutSettings,
): LayoutSettings & { isValid: boolean } => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...defaults, isValid: false }
  }

  const candidate = raw as Record<string, unknown>
  const isValidPreset =
    typeof candidate.layoutPreset === "string" &&
    LAYOUT_PRESETS.includes(candidate.layoutPreset as LayoutPreset)
  const panelOrder = normalizePanelOrder(candidate.panelOrder, defaults.panelOrder)
  const panelVisibility = normalizePanelVisibility(
    candidate.panelVisibility,
    defaults.panelVisibility,
  )
  const customLayout = normalizeCustomLayout(candidate.customLayout)

  if (
    !isValidPreset ||
    panelOrder === null ||
    panelVisibility === null ||
    customLayout === null
  ) {
    return { ...defaults, isValid: false }
  }

  return {
    layoutPreset: candidate.layoutPreset as LayoutPreset,
    customLayout,
    panelOrder,
    panelVisibility,
    isValid: true,
  }
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
  resetLayoutSettings: () => void
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
  const normalizedLayout = normalizeLayoutSettings(settings, defaultLayoutSettings)
  const settingsWithNormalizedLayout: AppSettings = normalizedLayout.isValid
    ? settings
    : {
        ...settings,
        layoutPreset: normalizedLayout.layoutPreset,
        customLayout: normalizedLayout.customLayout,
        panelOrder: normalizedLayout.panelOrder,
        panelVisibility: normalizedLayout.panelVisibility,
      }

  useEffect(() => {
    if (normalizedLayout.isValid) return

    setSettings((prev) => ({
      ...prev,
      layoutPreset: normalizedLayout.layoutPreset,
      customLayout: normalizedLayout.customLayout,
      panelOrder: normalizedLayout.panelOrder,
      panelVisibility: normalizedLayout.panelVisibility,
    }))
  }, [normalizedLayout, setSettings])

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
    const currentKeys = settingsWithNormalizedLayout.shortcuts[shortcutName].keys
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

  const resetLayoutSettings = () => {
    setSettings((prev) => ({
      ...prev,
      layoutPreset: defaultLayoutSettings.layoutPreset,
      customLayout: { ...defaultLayoutSettings.customLayout },
      panelOrder: [...defaultLayoutSettings.panelOrder],
      panelVisibility: { ...defaultLayoutSettings.panelVisibility },
    }))
    addToast({
      message: "Layout settings reset to default",
      icon: icons.Check,
    })
  }

  useEffect(() => {
    if (!settingsWithNormalizedLayout.autoBackupEnabled) {
      setLastBackupTimestamp(null)
    } else if (
      settingsWithNormalizedLayout.autoBackupEnabled &&
      lastBackupTimestamp === null
    ) {
      setLastBackupTimestamp(Date.now())
    }
  }, [
    settingsWithNormalizedLayout.autoBackupEnabled,
    lastBackupTimestamp,
    setLastBackupTimestamp,
  ])

  return (
    <SettingsContext.Provider
      value={{
        settings: settingsWithNormalizedLayout,
        isDisableShortcuts,
        disableShortcuts: () => setIsDisableShortcuts(true),
        enableShortcuts: () => setIsDisableShortcuts(false),
        updateSetting,
        updateShortcut,
        resetShortcut,
        resetLayoutSettings,
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
