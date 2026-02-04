"use client"

import { useTheme } from "@/context/ThemeContext"
import { Button } from "./ui/Button"

export function Header() {
  const { theme, toggleTheme, getIcon, getTitle } = useTheme()

  return (
    <header className="w-full">
      <nav className="h-16 border-2 rounded-xl border-[rgb(var(--border))] bg-[rgb(var(--card))] flex items-center justify-between px-4">
        <h1 className="font-bold text-xl">Vigilare</h1>
        <Button onClick={toggleTheme} title={getTitle(theme)}>
          {getIcon(theme)}
        </Button>
      </nav>
    </header>
  )
}
