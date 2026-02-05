"use client"

import { DataProvider } from "@/context/DataContext"
import { ModalOpenProvider } from "@/context/ModalContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DataProvider>
        <ModalOpenProvider>{children}</ModalOpenProvider>
      </DataProvider>
    </ThemeProvider>
  )
}
