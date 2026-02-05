"use client"

import { useTheme } from "@/context/ThemeContext"
import { useModal } from "@/context/ModalContext"
import { useSettings } from "@/context/SettingsContext"
import { Button } from "./ui/Button"
import { Menu, Search, Settings, SquareChevronRight } from "lucide-react"

export function Header() {
  const { theme, toggleTheme, getIcon, getTitle } = useTheme()
  const { openModal } = useModal()
  const { settings } = useSettings()

  const iconSize = settings.compactMode ? 16 : 20
  const mobileIconSize = settings.compactMode ? 14 : 18

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
          <Button
            onClick={() => openModal("globalSearch")}
            title="Search"
            variant="secondary"
          >
            <Search size={iconSize} />
          </Button>
          <Button
            onClick={() => openModal("settings")}
            title="Settings"
            variant="secondary"
          >
            <Settings size={iconSize} />
          </Button>
          <Button
            onClick={() => openModal("commandPalette")}
            title="Command Palette"
            variant="secondary"
          >
            <SquareChevronRight size={iconSize} />
          </Button>
          <Button
            onClick={toggleTheme}
            title={getTitle(theme)}
            variant="secondary"
          >
            {getIcon(theme, iconSize)}
          </Button>
        </div>

        <div className="flex sm:hidden items-center gap-2">
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
