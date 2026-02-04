"use client"

import { PanelAddProvider } from "@/context/PanelAddContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PanelAddProvider>{children}</PanelAddProvider>
    </ThemeProvider>
  )
}
