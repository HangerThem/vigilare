"use client"

import { ModalOpenProvider } from "@/context/ModalOpenContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ModalOpenProvider>{children}</ModalOpenProvider>
    </ThemeProvider>
  )
}
