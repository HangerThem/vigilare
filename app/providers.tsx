"use client"

import { PanelAddProvider } from "@/context/PanelAddContext"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return <PanelAddProvider>{children}</PanelAddProvider>
}
