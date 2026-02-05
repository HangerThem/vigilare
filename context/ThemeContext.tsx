"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react"

export type Theme = "light" | "dark" | "system"

type ThemeContextType = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  getIcon: (theme: Theme) => ReactNode
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

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system"
  return (localStorage.getItem("theme") as Theme) || "system"
}

function disableTransitionsTemporarily() {
  const root = document.documentElement
  root.classList.add("disable-transitions")

  void root.offsetHeight

  setTimeout(() => {
    root.classList.remove("disable-transitions")
  }, 50)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [themeOptions] = useState<Theme[]>(["light", "dark", "system"])

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme

  useEffect(() => {
    const root = document.documentElement

    disableTransitionsTemporarily()

    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)

    localStorage.setItem("theme", theme)
  }, [theme, resolvedTheme])

  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      disableTransitionsTemporarily()

      const resolved = getSystemTheme()
      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(resolved)
    }

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "light") return "dark"
      if (prev === "dark") return "system"
      return "light"
    })
  }, [])

  const getIcon = (theme: Theme) => {
    switch (theme) {
      case "light":
        return <Sun size={20} />
      case "dark":
        return <Moon size={20} />
      case "system":
        return <Monitor size={20} />
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
