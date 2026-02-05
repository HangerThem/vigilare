"use client"

import Modal from "./Modal"
import { useSettings } from "@/context/SettingsContext"
import { Select } from "../ui/Select"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { useState } from "react"
import Toggle from "../ui/Toggle"

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
  const { settings, updateSetting, resetSettings } = useSettings()
  const [activeTab, setActiveTab] = useState<
    "appearance" | "behavior" | "data"
  >("appearance")

  const tabs = [
    { id: "appearance" as const, label: "Appearance" },
    { id: "behavior" as const, label: "Behavior" },
    { id: "data" as const, label: "Data" },
  ]

  return (
    <Modal name="settings">
      <div className="w-full sm:w-96 md:w-140">
        <h2 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">Settings</h2>

        <div className="flex gap-1 mb-4 sm:mb-6 border-b border-[rgb(var(--border))] overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          ))}
        </div>

        <div className="space-y-6 max-h-60 sm:max-h-80 md:max-h-96 overflow-y-auto pr-2">
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
