"use client"

import Modal from "@/components/modals/Modal"
import { useSettings } from "@/context/SettingsContext"
import { Select } from "@/components/ui/Select"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import Toggle from "@/components/ui/Toggle"
import {
  ChevronDown,
  ChevronUp,
  Cloud,
  CloudOff,
  Command,
  GripVertical,
  RefreshCcw,
  RotateCcw,
} from "lucide-react"
import {
  AppSettings,
  LayoutPreset,
  PANEL_KEYS,
  PanelKey,
  ShortcutName,
} from "@/context/SettingsContext"
import { downloadSettings, importSettingsFile } from "@/utils/appData"
import { useToast } from "@/context/ToastContext"
import SortableJS from "sortablejs"
import { cn } from "@/utils/cn"
import { getPreviewModel } from "@/utils/layout"
import { useSync } from "@/context/SyncContext"
import { useModal } from "@/context/ModalContext"

const MODIFIER_KEYS = ["Shift", "Control", "Meta", "Alt"]

const normalizeKey = (key: string) => {
  if (key === " ") return "Space"
  if (key === "Control") return "Ctrl"
  if (key.length === 1) return key.toUpperCase()
  return key
}

const getShortcutKeys = (event: KeyboardEvent) => {
  if (MODIFIER_KEYS.includes(event.key)) {
    return null
  }

  const keys: string[] = []

  if (event.metaKey) keys.push("Meta")
  if (event.ctrlKey) keys.push("Ctrl")
  if (event.altKey) keys.push("Alt")
  if (event.shiftKey) keys.push("Shift")

  keys.push(normalizeKey(event.key))
  return keys
}

const getShortcutSignature = (keys: string[]) => keys.join("+")
const PANEL_LABELS: Record<PanelKey, string> = {
  links: "Links",
  notes: "Notes",
  snippets: "Snippets",
  status: "Status",
}
const LAYOUT_PRESET_OPTIONS: {
  value: LayoutPreset
  label: string
  description: string
}[] = [
  {
    value: "quad",
    label: "2x2 Grid",
    description: "Balanced layout with two columns.",
  },
  {
    value: "focusLeft",
    label: "Focus Left",
    description: "Feature the first panel on desktop.",
  },
  {
    value: "focusRight",
    label: "Focus Right",
    description: "Feature the last panel on desktop.",
  },
  {
    value: "singleColumn",
    label: "Single Column",
    description: "Stack all panels in one column.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Choose columns, focus panel, and order.",
  },
]

const SYNC_STATUS_META: Record<
  "local" | "connecting" | "synced" | "offline" | "error",
  { label: string; className: string; icon: typeof Cloud }
> = {
  local: {
    label: "Local",
    className: "border-[rgb(var(--border))] text-[rgb(var(--muted))]",
    icon: CloudOff,
  },
  connecting: {
    label: "Connecting",
    className: "border-amber-400/60 text-amber-300",
    icon: RefreshCcw,
  },
  synced: {
    label: "Synced",
    className: "border-emerald-500/60 text-emerald-300",
    icon: Cloud,
  },
  offline: {
    label: "Offline",
    className: "border-orange-500/60 text-orange-300",
    icon: CloudOff,
  },
  error: {
    label: "Error",
    className: "border-red-500/60 text-red-300",
    icon: CloudOff,
  },
}

function LayoutPreview({ settings }: { settings: AppSettings }) {
  const preview = getPreviewModel(settings)
  const isFocusPreset =
    settings.layoutPreset === "focusLeft" ||
    settings.layoutPreset === "focusRight"
  const previewSideRows = Math.max(preview.visiblePanels.length - 1, 1)
  const previewSidePanelRows: Partial<Record<PanelKey, number>> = {}

  if (isFocusPreset && preview.featuredPanel) {
    preview.visiblePanels
      .filter((panel) => panel !== preview.featuredPanel)
      .forEach((panel, index) => {
        previewSidePanelRows[panel] = index + 1
      })
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Preview</label>
      <div
        className={cn(
          "grid gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted-background))] p-3",
          isFocusPreset && preview.featuredPanel
            ? "[grid-template-rows:repeat(var(--preview-side-rows),minmax(0,1fr))]"
            : "",
          preview.columns === 1
            ? "grid-cols-1"
            : preview.columns === 2
              ? "grid-cols-2"
              : "grid-cols-3",
        )}
        style={
          isFocusPreset && preview.featuredPanel
            ? ({
                ["--preview-side-rows"]: String(previewSideRows),
              } as CSSProperties)
            : undefined
        }
      >
        {preview.visiblePanels.map((panel) => {
          const sideRowStart = previewSidePanelRows[panel]
          const isFeaturedPanel = preview.featuredPanel === panel
          const panelClassName = cn(
            "rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-3 text-xs font-semibold text-[rgb(var(--foreground))]",
            !isFeaturedPanel
              ? isFocusPreset && preview.featuredPanel
                ? `${settings.layoutPreset === "focusRight" ? "col-start-1" : "col-start-3"} [grid-row-start:var(--preview-panel-row)] [grid-row-end:span_1]`
                : ""
              : settings.layoutPreset === "focusRight"
                ? "col-start-2 col-span-2 [grid-row:1/-1]"
                : settings.layoutPreset === "focusLeft"
                  ? "col-span-2 [grid-row:1/-1]"
                  : "col-span-2",
          )
          const panelStyle =
            !isFeaturedPanel &&
            isFocusPreset &&
            preview.featuredPanel &&
            sideRowStart
              ? ({
                  ["--preview-panel-row"]: String(sideRowStart),
                } as CSSProperties)
              : undefined

          return (
            <div key={panel} className={panelClassName} style={panelStyle}>
              {PANEL_LABELS[panel]}
            </div>
          )
        })}
      </div>
      <div className="text-xs text-[rgb(var(--muted))]">
        Preview reflects desktop layout. Mobile stays single-column.
      </div>
    </div>
  )
}

function SettingSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-[rgb(var(--muted))] uppercase tracking-wide">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export default function SettingsModal() {
  const {
    settings,
    updateSetting,
    updateShortcut,
    resetShortcut,
    resetLayoutSettings,
    resetSettings,
    disableShortcuts,
    enableShortcuts,
    isShortcutChanged,
  } = useSettings()
  const { addToast } = useToast()
  const sync = useSync()
  const { openModal } = useModal()
  const [activeTab, setActiveTab] = useState<
    | "appearance"
    | "layout"
    | "behavior"
    | "data"
    | "sync"
    | "shortcuts"
    | "advanced"
  >("appearance")
  const [editingShortcut, setEditingShortcut] = useState<ShortcutName | null>(
    null,
  )
  const [shortcutConflict, setShortcutConflict] = useState<string | null>(null)
  const [shortcutPreview, setShortcutPreview] = useState<string[] | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [pendingConflict, setPendingConflict] = useState<{
    name: ShortcutName
    keys: string[]
  } | null>(null)
  const layoutOrderRef = useRef<HTMLUListElement>(null)
  const layoutSortableRef = useRef<SortableJS | null>(null)

  const clearEditingMessages = useCallback(() => {
    setShortcutConflict(null)
    setShortcutPreview(null)
    setValidationError(null)
    setPendingConflict(null)
  }, [])

  const resetEditingState = useCallback(() => {
    setEditingShortcut(null)
    clearEditingMessages()
    enableShortcuts()
  }, [clearEditingMessages, enableShortcuts])

  const beginEditingShortcut = useCallback(
    (name: ShortcutName) => {
      setEditingShortcut(name)
      clearEditingMessages()
    },
    [clearEditingMessages],
  )

  const tabs = [
    { id: "appearance" as const, label: "Appearance" },
    { id: "layout" as const, label: "Layout" },
    { id: "behavior" as const, label: "Behavior" },
    { id: "data" as const, label: "Data" },
    { id: "sync" as const, label: "Sync" },
    { id: "shortcuts" as const, label: "Shortcuts" },
    { id: "advanced" as const, label: "Advanced" },
  ]
  const isMobileUserAgent =
    typeof navigator !== "undefined" && navigator.userAgent.includes("Mobi")
  const isFocusPreset =
    settings.layoutPreset === "focusLeft" ||
    settings.layoutPreset === "focusRight"

  const getVisiblePanelsFromVisibility = useCallback(
    (visibility: Record<PanelKey, boolean>) => {
      const visiblePanels = settings.panelOrder.filter(
        (panel) => visibility[panel],
      )
      return visiblePanels.length > 0 ? visiblePanels : [PANEL_KEYS[0]]
    },
    [settings.panelOrder],
  )

  const handleLayoutPresetChange = (layoutPreset: LayoutPreset) => {
    updateSetting("layoutPreset", layoutPreset)

    if (layoutPreset === "focusLeft" || layoutPreset === "focusRight") {
      const focusedPanel = settings.customLayout.focusPanel
      const isFocusedVisible =
        focusedPanel !== null && settings.panelVisibility[focusedPanel]
      if (isFocusedVisible) return

      const visiblePanels = getVisiblePanelsFromVisibility(
        settings.panelVisibility,
      )
      const fallbackFocusPanel =
        layoutPreset === "focusRight"
          ? visiblePanels[visiblePanels.length - 1]
          : visiblePanels[0]

      updateSetting("customLayout", {
        ...settings.customLayout,
        focusPanel: fallbackFocusPanel,
      })
    }
  }

  const reorderPanelOrder = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return
      if (oldIndex < 0 || newIndex < 0) return
      if (oldIndex >= settings.panelOrder.length) return
      if (newIndex >= settings.panelOrder.length) return

      const nextOrder = [...settings.panelOrder]
      const [movedPanel] = nextOrder.splice(oldIndex, 1)
      nextOrder.splice(newIndex, 0, movedPanel)
      updateSetting("panelOrder", nextOrder)
    },
    [settings.panelOrder, updateSetting],
  )

  const handleMovePanel = useCallback(
    (panel: PanelKey, direction: "up" | "down") => {
      const index = settings.panelOrder.indexOf(panel)
      if (index === -1) return
      const nextIndex = direction === "up" ? index - 1 : index + 1
      reorderPanelOrder(index, nextIndex)
    },
    [reorderPanelOrder, settings.panelOrder],
  )

  const handlePanelVisibilityChange = (panel: PanelKey, checked: boolean) => {
    const nextPanelVisibility = {
      ...settings.panelVisibility,
      [panel]: checked,
    }
    const visiblePanelsAfterChange = settings.panelOrder.filter(
      (item) => nextPanelVisibility[item],
    )

    if (
      !checked &&
      settings.panelVisibility[panel] &&
      visiblePanelsAfterChange.length <= 0
    ) {
      addToast({
        message: "At least one panel must remain visible",
        icon: RotateCcw,
      })
      return
    }

    updateSetting("panelVisibility", nextPanelVisibility)

    if (!checked && settings.customLayout.focusPanel === panel) {
      if (isFocusPreset) {
        const fallbackFocusPanel =
          settings.layoutPreset === "focusRight"
            ? visiblePanelsAfterChange[visiblePanelsAfterChange.length - 1]
            : visiblePanelsAfterChange[0]
        updateSetting("customLayout", {
          ...settings.customLayout,
          focusPanel: fallbackFocusPanel ?? null,
        })
      } else if (settings.layoutPreset === "custom") {
        updateSetting("customLayout", {
          ...settings.customLayout,
          focusPanel: null,
        })
      }
    }
  }

  useEffect(() => {
    if (activeTab !== "layout" || !layoutOrderRef.current) {
      if (layoutSortableRef.current) {
        layoutSortableRef.current.destroy()
        layoutSortableRef.current = null
      }
      return
    }

    layoutSortableRef.current = SortableJS.create(layoutOrderRef.current, {
      animation: 150,
      handle: ".layout-handle",
      onEnd: (event) => {
        if (event.oldIndex === undefined || event.newIndex === undefined) return
        reorderPanelOrder(event.oldIndex, event.newIndex)
      },
    })

    return () => {
      if (layoutSortableRef.current) {
        layoutSortableRef.current.destroy()
        layoutSortableRef.current = null
      }
    }
  }, [activeTab, reorderPanelOrder])

  const syncStatusMeta = SYNC_STATUS_META[sync.syncStatus.state]

  useEffect(() => {
    if (!editingShortcut) return
    disableShortcuts()

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (event.key === "Escape") {
        resetEditingState()
        return
      }

      if (event.key === "Backspace") {
        updateShortcut(editingShortcut, [])
        resetEditingState()
        return
      }

      const keys = getShortcutKeys(event)
      if (!keys) return

      const hasModifier = keys.some((key) =>
        ["Ctrl", "Meta", "Alt", "Shift"].includes(key),
      )
      const primaryKey = keys[keys.length - 1]
      const isFunctionKey = /^F(1[0-2]|[1-9])$/.test(primaryKey)
      if (!hasModifier && !isFunctionKey) {
        setValidationError("Shortcuts must include a modifier key.")
        setShortcutPreview(keys)
        setShortcutConflict(null)
        setPendingConflict(null)
        return
      }

      const newSignature = getShortcutSignature(keys)
      const conflict = Object.entries(settings.shortcuts).find(
        ([name, shortcut]) =>
          name !== editingShortcut &&
          getShortcutSignature(shortcut.keys) === newSignature,
      )

      if (conflict) {
        setShortcutPreview(keys)
        setValidationError(null)
        setShortcutConflict(
          `Already used by ${settings.shortcuts[conflict[0] as ShortcutName].designation}`,
        )
        setPendingConflict({ name: conflict[0] as ShortcutName, keys })
        return
      }

      updateShortcut(editingShortcut, keys)
      resetEditingState()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      enableShortcuts()
    }
  }, [
    editingShortcut,
    settings.shortcuts,
    updateShortcut,
    disableShortcuts,
    enableShortcuts,
    resetEditingState,
  ])

  return (
    <Modal name="settings">
      <div className="w-full sm:w-96 md:w-140">
        <h2 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">Settings</h2>

        <div className="flex gap-1 mb-4 sm:mb-6 border-b border-[rgb(var(--border))] overflow-x-auto">
          {tabs.map((tab) =>
            isMobileUserAgent && tab.id === "shortcuts" ? null : (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  resetEditingState()
                }}
                className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-[rgb(var(--foreground))]"
                    : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(var(--primary))]" />
                )}
              </button>
            ),
          )}
        </div>

        <div className="space-y-8">
          {activeTab === "appearance" && (
            <>
              <SettingSection title="Display">
                <Toggle
                  checked={settings.compactMode}
                  onChange={(v) => updateSetting("compactMode", v)}
                  label="Compact mode"
                  description="Reduce spacing and font size for a denser layout."
                />
                <Toggle
                  checked={settings.showAnimations}
                  onChange={(v) => updateSetting("showAnimations", v)}
                  label="Enable animations"
                  description="Smooth transitions and subtle effects."
                />
                <Toggle
                  checked={settings.showOfflineIndicator}
                  onChange={(v) => updateSetting("showOfflineIndicator", v)}
                  label="Show offline indicator"
                  description="Display a banner when offline."
                />
              </SettingSection>
            </>
          )}

          {activeTab === "layout" && (
            <div className="overflow-y-auto h-60 sm:h-80 md:h-96 pr-2">
              <SettingSection title="Layout">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preset</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LAYOUT_PRESET_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleLayoutPresetChange(option.value)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer",
                          settings.layoutPreset === option.value
                            ? "border-[rgb(var(--primary))] bg-[rgb(var(--muted-background))]"
                            : "border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))]",
                        )}
                      >
                        <div className="text-sm font-medium">
                          {option.label}
                        </div>
                        <div className="text-xs text-[rgb(var(--muted))] mt-0.5">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {settings.layoutPreset === "custom" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Desktop columns
                    </label>
                    <div className="inline-flex rounded-lg border border-[rgb(var(--border))] overflow-hidden">
                      {[1, 2, 3].map((columns) => (
                        <button
                          key={columns}
                          type="button"
                          onClick={() =>
                            updateSetting("customLayout", {
                              ...settings.customLayout,
                              columns: columns as 1 | 2 | 3,
                            })
                          }
                          className={cn(
                            "px-3 py-1.5 text-sm transition-colors cursor-pointer",
                            settings.customLayout.columns === columns
                              ? "bg-[rgb(var(--primary))] text-[rgb(var(--background))]"
                              : "bg-[rgb(var(--card))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--card-hover))]",
                          )}
                        >
                          {columns}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(settings.layoutPreset === "custom" || isFocusPreset) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Focus panel</label>
                    <Select
                      clearable={settings.layoutPreset === "custom"}
                      value={settings.customLayout.focusPanel}
                      onChange={(value) => {
                        if (value === null && isFocusPreset) {
                          const visiblePanels = getVisiblePanelsFromVisibility(
                            settings.panelVisibility,
                          )
                          const fallbackFocusPanel =
                            settings.layoutPreset === "focusRight"
                              ? visiblePanels[visiblePanels.length - 1]
                              : visiblePanels[0]
                          updateSetting("customLayout", {
                            ...settings.customLayout,
                            focusPanel: fallbackFocusPanel,
                          })
                          return
                        }

                        updateSetting("customLayout", {
                          ...settings.customLayout,
                          focusPanel: value as PanelKey | null,
                        })
                      }}
                      placeholder="No focus panel"
                      options={settings.panelOrder.map((panel) => ({
                        value: panel,
                        label: PANEL_LABELS[panel],
                        description: settings.panelVisibility[panel]
                          ? "Visible"
                          : "Hidden",
                      }))}
                    />
                    {isFocusPreset && (
                      <div className="text-xs text-[rgb(var(--muted))]">
                        Focus mode always targets the selected panel.
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Panel order and visibility
                  </label>
                  <ul ref={layoutOrderRef} className="space-y-2">
                    {settings.panelOrder.map((panel, index) => (
                      <li
                        key={panel}
                        className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 bg-[rgb(var(--card))]"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="layout-handle text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] cursor-grab active:cursor-grabbing p-1"
                            aria-label={`Drag ${PANEL_LABELS[panel]}`}
                          >
                            <GripVertical size={16} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <span>{PANEL_LABELS[panel]}</span>
                              {(isFocusPreset ||
                                settings.layoutPreset === "custom") &&
                                settings.customLayout.focusPanel === panel && (
                                  <span className="text-[10px] uppercase tracking-wide border border-[rgb(var(--primary))] text-[rgb(var(--primary))] rounded px-1.5 py-0.5">
                                    Focused
                                  </span>
                                )}
                            </div>
                            <div className="text-xs text-[rgb(var(--muted))]">
                              {settings.panelVisibility[panel]
                                ? "Visible"
                                : "Hidden"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleMovePanel(panel, "up")}
                            disabled={index === 0}
                            className="p-1 rounded border border-[rgb(var(--border))] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[rgb(var(--border-hover))] cursor-pointer"
                            aria-label={`Move ${PANEL_LABELS[panel]} up`}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePanel(panel, "down")}
                            disabled={index === settings.panelOrder.length - 1}
                            className="p-1 rounded border border-[rgb(var(--border))] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[rgb(var(--border-hover))] cursor-pointer"
                            aria-label={`Move ${PANEL_LABELS[panel]} down`}
                          >
                            <ChevronDown size={14} />
                          </button>
                          {(isFocusPreset ||
                            settings.layoutPreset === "custom") && (
                            <button
                              type="button"
                              onClick={() =>
                                updateSetting("customLayout", {
                                  ...settings.customLayout,
                                  focusPanel: panel,
                                })
                              }
                              className={cn(
                                "rounded-md border px-2 py-1 text-xs font-medium cursor-pointer",
                                settings.customLayout.focusPanel === panel
                                  ? "border-[rgb(var(--primary))] text-[rgb(var(--primary))]"
                                  : "border-[rgb(var(--border))] text-[rgb(var(--muted))]",
                              )}
                            >
                              Focus
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handlePanelVisibilityChange(
                                panel,
                                !settings.panelVisibility[panel],
                              )
                            }
                            className={cn(
                              "rounded-md border px-2 py-1 text-xs font-medium cursor-pointer",
                              settings.panelVisibility[panel]
                                ? "border-[rgb(var(--primary))] text-[rgb(var(--primary))]"
                                : "border-[rgb(var(--border))] text-[rgb(var(--muted))]",
                            )}
                            aria-pressed={settings.panelVisibility[panel]}
                          >
                            {settings.panelVisibility[panel]
                              ? "Shown"
                              : "Hidden"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <LayoutPreview settings={settings} />

                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={resetLayoutSettings}
                    className="text-sm"
                  >
                    Reset Layout
                  </Button>
                </div>
              </SettingSection>
            </div>
          )}

          {activeTab === "behavior" && (
            <>
              <SettingSection title="General">
                <Toggle
                  checked={settings.confirmBeforeDelete}
                  onChange={(v) => updateSetting("confirmBeforeDelete", v)}
                  label="Confirm before deleting items"
                  description="Show a confirmation dialog before deleting."
                />
                <Toggle
                  checked={settings.openLinksInNewTab}
                  onChange={(v) => updateSetting("openLinksInNewTab", v)}
                  label="Open links in new tab"
                  description="External links will open in a new browser tab."
                />
              </SettingSection>

              <SettingSection title="Search">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Search sensitivity
                  </label>
                  <Select
                    options={[
                      { value: 0.1, label: "Strict" },
                      { value: 0.3, label: "Normal" },
                      { value: 0.5, label: "Fuzzy" },
                    ]}
                    value={settings.fuzzySearchThreshold}
                    onChange={(v) =>
                      updateSetting("fuzzySearchThreshold", v as number)
                    }
                  />
                  <div className="text-xs text-[rgb(var(--muted))]">
                    Controls how closely results must match your query.
                  </div>
                </div>
              </SettingSection>
            </>
          )}

          {activeTab === "data" && (
            <>
              <SettingSection title="Backup">
                <Toggle
                  checked={settings.autoBackupEnabled}
                  onChange={(v) => updateSetting("autoBackupEnabled", v)}
                  label="Enable automatic backups"
                  description="Automatically backup your data at regular intervals."
                />
                {settings.autoBackupEnabled && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Backup interval (days)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={settings.autoBackupIntervalDays}
                      onChange={(e) =>
                        updateSetting(
                          "autoBackupIntervalDays",
                          parseInt(e.target.value) || 7,
                        )
                      }
                    />
                    <div className="text-xs text-[rgb(var(--muted))]">
                      How often to create automatic backups.
                    </div>
                  </div>
                )}
              </SettingSection>

              <SettingSection title="Limits">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Max items per panel{" "}
                    <span className="text-xs">(0 = unlimited)</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    value={settings.maxItemsPerPanel}
                    onChange={(e) =>
                      updateSetting(
                        "maxItemsPerPanel",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                  <div className="text-xs text-[rgb(var(--muted))]">
                    Prevents panels from growing too large.
                  </div>
                </div>
              </SettingSection>
            </>
          )}

          {activeTab === "sync" && (
            <>
              <SettingSection title="Workspace">
                {!sync.syncEnabled ? (
                  <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted-background))] p-3 text-sm text-[rgb(var(--muted))]">
                    Sync is disabled. Set
                    <span className="mx-1 font-mono text-[rgb(var(--foreground))]">
                      NEXT_PUBLIC_SYNC_ENABLED=true
                    </span>
                    to enable account-backed remote workspaces.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted-background))] px-3 py-2">
                      <div className="text-sm text-[rgb(var(--muted))]">
                        Open Sync Hub for account, workspaces, invites, and join
                        tools.
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs",
                          syncStatusMeta.className,
                        )}
                      >
                        <syncStatusMeta.icon size={12} />
                        {syncStatusMeta.label}
                      </span>
                    </div>

                    {sync.syncStatus.errorMessage && (
                      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs sm:text-sm text-red-200">
                        {sync.syncStatus.errorMessage}
                      </div>
                    )}

                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => openModal("syncHub")}
                    >
                      Open Sync Hub
                    </Button>
                  </div>
                )}
              </SettingSection>
            </>
          )}

          {activeTab === "shortcuts" && (
            <>
              <div className="h-60 sm:h-80 md:h-96 flex flex-col gap-3">
                {(validationError || shortcutConflict) && (
                  <div className="space-y-2" aria-live="polite">
                    {validationError && (
                      <div className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-xs sm:text-sm text-amber-200">
                        {validationError}
                      </div>
                    )}
                    {shortcutConflict && (
                      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs sm:text-sm text-red-200">
                        <div>{shortcutConflict}</div>
                        {pendingConflict && editingShortcut && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              className="text-xs sm:text-sm"
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                const currentKeys =
                                  settings.shortcuts[editingShortcut].keys
                                updateShortcut(
                                  editingShortcut,
                                  pendingConflict.keys,
                                )
                                updateShortcut(
                                  pendingConflict.name,
                                  currentKeys,
                                )
                                resetEditingState()
                              }}
                            >
                              Swap
                            </Button>
                            <Button
                              variant="primary"
                              className="text-xs sm:text-sm"
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                updateShortcut(pendingConflict.name, [])
                                updateShortcut(
                                  editingShortcut,
                                  pendingConflict.keys,
                                )
                                resetEditingState()
                              }}
                            >
                              Overwrite
                            </Button>
                            <Button
                              variant="secondary"
                              className="text-xs sm:text-sm"
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                resetEditingState()
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[rgb(var(--muted))]">
                  Click a shortcut to edit, then press the new key combo.
                  {editingShortcut && (
                    <span className="block mt-1">
                      Press <span className="font-medium">Esc</span> to cancel
                      or <span className="font-medium">Backspace</span> to
                      clear.
                    </span>
                  )}
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                  {(
                    Object.entries(settings.shortcuts) as [
                      ShortcutName,
                      (typeof settings.shortcuts)[ShortcutName],
                    ][]
                  ).map(([name, shortcut]) => {
                    const isEditing = editingShortcut === name
                    const displayKeys =
                      isEditing && shortcutPreview
                        ? shortcutPreview
                        : shortcut.keys

                    return (
                      <div
                        key={shortcut.designation}
                        onClick={() => {
                          beginEditingShortcut(name)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            beginEditingShortcut(name)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={`w-full text-left rounded-lg border px-3 py-2 transition-colors cursor-pointer ${
                          isEditing
                            ? "border-[rgb(var(--primary))] bg-[rgb(var(--muted-background))]"
                            : "border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))]"
                        }`}
                        aria-label={`Edit shortcut for ${shortcut.designation}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">
                              {shortcut.designation}
                            </div>
                            {isShortcutChanged(name) && (
                              <Button
                                variant="ghost"
                                className="text-xs sm:text-sm"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  resetShortcut(name)
                                  clearEditingMessages()
                                }}
                                aria-label="Reset to default"
                              >
                                <RotateCcw
                                  size={14}
                                  aria-label="Reset to default"
                                />
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-wrap justify-between gap-2">
                            <div className="flex gap-1 flex-wrap justify-end">
                              {displayKeys.length === 0 ? (
                                <span className="text-xs text-[rgb(var(--muted))]">
                                  Not set
                                </span>
                              ) : (
                                displayKeys.map((key, index) => (
                                  <kbd
                                    key={`${key}-${index}`}
                                    className={`font-sans px-1.5 sm:px-2 py-0.5 sm:py-1 border rounded bg-[rgb(var(--muted-background))] text-xs sm:text-sm flex items-center justify-center ${
                                      isEditing
                                        ? "border-[rgb(var(--primary))] text-[rgb(var(--foreground))]"
                                        : "border-[rgb(var(--muted))] text-[rgb(var(--muted))]"
                                    }`}
                                  >
                                    {key === "Meta" ? (
                                      <Command size={14} aria-label="Command" />
                                    ) : (
                                      key
                                    )}
                                  </kbd>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                        {isEditing && (
                          <div className="mt-2 text-xs text-[rgb(var(--muted))]">
                            Waiting for new shortcut...
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === "advanced" && (
            <>
              <div className="space-y-2">
                <h2 className="font-semibold text-sm text-[rgb(var(--muted))] uppercase tracking-wide">
                  Data Management
                </h2>
                <Button
                  variant="secondary"
                  onClick={() => downloadSettings()}
                  className="text-sm sm:text-base"
                >
                  Export Settings
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    importSettingsFile()
                      .then(() => {
                        addToast({
                          message: "Settings imported successfully",
                          icon: RotateCcw,
                        })
                      })
                      .catch((error) => {
                        addToast({
                          message: error.message,
                          icon: RotateCcw,
                        })
                      })
                  }}
                  className="text-sm sm:text-base"
                >
                  Import Settings
                </Button>
                <h2 className="font-semibold text-sm text-[rgb(var(--muted))] uppercase tracking-wide mt-4">
                  Danger Zone
                </h2>
                <Button
                  variant="danger"
                  onClick={resetSettings}
                  className="text-sm sm:text-base"
                >
                  Reset to Defaults
                </Button>
              </div>
              <div className="mt-2 text-xs text-[rgb(var(--muted))]">
                Importing will overwrite your current settings.
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
