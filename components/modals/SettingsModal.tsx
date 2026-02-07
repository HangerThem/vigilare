"use client"

import Modal from "./Modal"
import { useSettings } from "@/context/SettingsContext"
import { Select } from "../ui/Select"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { useCallback, useEffect, useState } from "react"
import Toggle from "../ui/Toggle"
import { Command, RotateCcw } from "lucide-react"
import { ShortcutName } from "@/context/SettingsContext"

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

function SettingSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
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
    resetSettings,
    startEditingShortcut,
    stopEditingShortcut,
    isShortcutChanged,
  } = useSettings()
  const [activeTab, setActiveTab] = useState<
    "appearance" | "behavior" | "data" | "shortcuts"
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

  const clearEditingMessages = useCallback(() => {
    setShortcutConflict(null)
    setShortcutPreview(null)
    setValidationError(null)
    setPendingConflict(null)
  }, [])

  const resetEditingState = useCallback(() => {
    setEditingShortcut(null)
    clearEditingMessages()
    stopEditingShortcut()
  }, [clearEditingMessages, stopEditingShortcut])

  const beginEditingShortcut = useCallback(
    (name: ShortcutName) => {
      setEditingShortcut(name)
      clearEditingMessages()
    },
    [clearEditingMessages],
  )

  const tabs = [
    { id: "appearance" as const, label: "Appearance" },
    { id: "behavior" as const, label: "Behavior" },
    { id: "data" as const, label: "Data" },
    { id: "shortcuts" as const, label: "Shortcuts" },
  ]

  useEffect(() => {
    if (!editingShortcut) return
    startEditingShortcut()

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
      stopEditingShortcut()
    }
  }, [
    editingShortcut,
    settings.shortcuts,
    updateShortcut,
    startEditingShortcut,
    stopEditingShortcut,
    resetEditingState,
  ])

  return (
    <Modal name="settings">
      <div className="w-full sm:w-96 md:w-140">
        <h2 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">Settings</h2>

        <div className="flex gap-1 mb-4 sm:mb-6 border-b border-[rgb(var(--border))] overflow-x-auto">
          {tabs.map((tab) =>
            navigator.userAgent.includes("Mobi") &&
            tab.id === "shortcuts" ? null : (
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

        <div className="space-y-6">
          {activeTab === "appearance" && (
            <>
              <SettingSection title="Display">
                <Toggle
                  checked={settings.compactMode}
                  onChange={(v) => updateSetting("compactMode", v)}
                  label="Compact mode"
                />
                <Toggle
                  checked={settings.showAnimations}
                  onChange={(v) => updateSetting("showAnimations", v)}
                  label="Enable animations"
                />
                <Toggle
                  checked={settings.showOfflineIndicator}
                  onChange={(v) => updateSetting("showOfflineIndicator", v)}
                  label="Show offline indicator"
                />
              </SettingSection>
            </>
          )}

          {activeTab === "behavior" && (
            <>
              <SettingSection title="General">
                <Toggle
                  checked={settings.confirmBeforeDelete}
                  onChange={(v) => updateSetting("confirmBeforeDelete", v)}
                  label="Confirm before deleting items"
                />
                <Toggle
                  checked={settings.openLinksInNewTab}
                  onChange={(v) => updateSetting("openLinksInNewTab", v)}
                  label="Open links in new tab"
                />
              </SettingSection>

              <SettingSection title="Search">
                <div className="space-y-2">
                  <label className="text-sm">Search sensitivity</label>
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
                />
                {settings.autoBackupEnabled && (
                  <div className="space-y-2">
                    <label className="text-sm">Backup interval (days)</label>
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
                  </div>
                )}
              </SettingSection>

              <SettingSection title="Limits">
                <div className="space-y-2">
                  <label className="text-sm">
                    Max items per panel (0 = unlimited)
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
                </div>
              </SettingSection>
            </>
          )}

          {activeTab === "shortcuts" && (
            <>
              {/* Fixed-height container: messages consume space, list flexes */}
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
                      Press to cancel or{" "}
                      <span className="font-medium">Backspace</span> to clear.
                    </span>
                  )}
                </div>

                {/* Scrollable shortcut list only */}
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
                                  <span
                                    key={`${key}-${index}`}
                                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 border rounded bg-[rgb(var(--muted-background))] text-xs sm:text-sm flex items-center justify-center ${
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
                                  </span>
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
        </div>

        <div className="flex justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[rgb(var(--border))]">
          <Button
            variant="secondary"
            onClick={resetSettings}
            className="text-sm sm:text-base"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </Modal>
  )
}
