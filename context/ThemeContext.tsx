"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react"
import { useSettings } from "@/context/SettingsContext"
import { useLocalStorageState } from "@/hook/useLocalStorageState"

export type Theme = "light" | "dark" | "system"

type ThemeContextType = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  getIcon: (theme: Theme, size?: number) => React.ReactNode
  getTitle: (theme: Theme) => string
  themeOptions: Theme[]
}

const ThemeContext = createContext<ThemeContextType | null>(null)

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function disableTransitionsTemporarily() {
  const root = document.documentElement
  root.classList.add("disable-transitions")

  void root.offsetHeight

  setTimeout(() => {
    root.classList.remove("disable-transitions")
  }, 50)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { value: theme, setValue: setThemeState } = useLocalStorageState<Theme>(
    "theme",
    "system",
  )
  const [themeOptions] = useState<Theme[]>(["light", "dark", "system"])
  const { settings } = useSettings()

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme

  useEffect(() => {
    const root = document.documentElement

    if (!settings.showAnimations) disableTransitionsTemporarily()

    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)

    setThemeState((prev) => {
      if (prev === "system") return "system"
      return resolvedTheme
    })
  }, [theme, resolvedTheme, settings.showAnimations, setThemeState])

  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (!settings.showAnimations) disableTransitionsTemporarily()

      const resolved = getSystemTheme()
      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(resolved)
    }

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [theme, settings.showAnimations])

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme)
    },
    [setThemeState],
  )

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "light") return "dark"
      if (prev === "dark") return "system"
      return "light"
    })
  }, [setThemeState])

  const getIcon = (theme: Theme, size: number = 20) => {
    switch (theme) {
      case "light":
        return <Sun size={size} />
      case "dark":
        return <Moon size={size} />
      case "system":
        return <Monitor size={size} />
    }
  }

  const getTitle = (theme: Theme) => {
    switch (theme) {
      case "light":
        return "Light mode - Click to switch to dark"
      case "dark":
        return "Dark mode - Click to switch to system"
      case "system":
        return "System mode - Click to switch to light"
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
        getIcon,
        getTitle,
        themeOptions,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
