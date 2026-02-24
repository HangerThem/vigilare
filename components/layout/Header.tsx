"use client"

import { useTheme } from "@/context/ThemeContext"
import { useModal } from "@/context/ModalContext"
import { useSettings } from "@/context/SettingsContext"
import { useSync } from "@/context/SyncContext"
import { Button } from "@/components/ui/Button"
import { cn } from "@/utils/cn"
import { SYNC_STATUS_META } from "@/utils/sync/statusMeta"
import { Menu, Search, Settings, SquareChevronRight } from "lucide-react"
import Tooltip from "../ui/Tooltip"
import { Select } from "../ui/Select"

export function Header() {
  const { theme, toggleTheme, getIcon, getTitle } = useTheme()
  const { openModal } = useModal()
  const { settings } = useSettings()
  const sync = useSync()

  const iconSize = settings.compactMode ? 16 : 20
  const mobileIconSize = settings.compactMode ? 14 : 18
  const syncStatusMeta = SYNC_STATUS_META[sync.syncStatus.state]

  return (
    <header className="w-full flex-shrink-0">
      <nav
        className={`${settings.compactMode ? "h-10 sm:h-11 md:h-12" : "h-12 sm:h-14 md:h-16"} border-2 rounded-xl border-[rgb(var(--border))] bg-[rgb(var(--card))] flex items-center justify-between px-3 sm:px-4`}
      >
        <h1
          className={`font-bold ${settings.compactMode ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}
        >
          Vigilare
        </h1>

        <div className="hidden sm:flex items-center gap-2">
          {sync.syncEnabled && (
            <>
              <Tooltip content="Sync Hub" delay={500}>
                <button
                  onClick={() => openModal("syncHub")}
                  className={cn(
                    "gap-1 px-4 py-2 text-xs rounded-lg border flex items-center cursor-pointer",
                    syncStatusMeta.className,
                  )}
                >
                  <syncStatusMeta.icon size={12} />
                  <span className="hidden md:inline">
                    {syncStatusMeta.label}
                  </span>
                </button>
              </Tooltip>
              <Select
                options={sync.instances.map((instance) => ({
                  value: instance.instanceId,
                  label: instance.label,
                }))}
                className="w-32"
                value={sync.activeInstanceId}
                onChange={(value) => sync.switchInstance(value as string)}
              />
            </>
          )}
          <Tooltip content="Search" delay={500}>
            <Button
              onClick={() => openModal("globalSearch")}
              variant="secondary"
            >
              <Search size={iconSize} />
            </Button>
          </Tooltip>
          <Tooltip content="Settings" delay={500}>
            <Button onClick={() => openModal("settings")} variant="secondary">
              <Settings size={iconSize} />
            </Button>
          </Tooltip>
          <Tooltip content="Command Palette" delay={500}>
            <Button
              onClick={() => openModal("commandPalette")}
              variant="secondary"
            >
              <SquareChevronRight size={iconSize} />
            </Button>
          </Tooltip>
          <Tooltip content={getTitle(theme)} delay={500}>
            <Button onClick={toggleTheme} variant="secondary">
              {getIcon(theme, iconSize)}
            </Button>
          </Tooltip>
        </div>

        <div className="flex sm:hidden items-center gap-2">
          {sync.syncEnabled && (
            <>
              <Button
                onClick={() => openModal("syncHub")}
                title={`Sync: ${syncStatusMeta.label}`}
                variant="secondary"
                className={cn("px-2", syncStatusMeta.className)}
              >
                <syncStatusMeta.icon size={mobileIconSize} />
              </Button>
              <select
                className="h-8 max-w-28 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 text-xs text-[rgb(var(--foreground))]"
                value={sync.activeInstanceId}
                onChange={(event) => sync.switchInstance(event.target.value)}
                aria-label="Switch workspace"
              >
                {sync.instances.map((instance) => (
                  <option key={instance.instanceId} value={instance.instanceId}>
                    {instance.label}
                  </option>
                ))}
              </select>
            </>
          )}
          <Button
            onClick={() => openModal("globalSearch")}
            title="Search"
            variant="secondary"
          >
            <Search size={mobileIconSize} />
          </Button>
          <Button
            onClick={() => openModal("commandPalette")}
            title="Menu"
            variant="secondary"
          >
            <Menu size={mobileIconSize} />
          </Button>
          <Button
            onClick={toggleTheme}
            title={getTitle(theme)}
            variant="secondary"
          >
            {getIcon(theme, mobileIconSize)}
          </Button>
        </div>
      </nav>
    </header>
  )
}
