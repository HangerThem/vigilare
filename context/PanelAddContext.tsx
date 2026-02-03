"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react"

type PanelType = "commands" | "links" | "notes" | "status"

type PanelAddContextType = {
  addingPanel: PanelType | null
  openAdd: (panel: PanelType) => void
  closeAdd: () => void
  isAdding: (panel: PanelType) => boolean
}

const PanelAddContext = createContext<PanelAddContextType | null>(null)

export function PanelAddProvider({ children }: { children: ReactNode }) {
  const [addingPanel, setAddingPanel] = useState<PanelType | null>(null)

  const openAdd = useCallback((panel: PanelType) => {
    setAddingPanel(panel)
  }, [])

  const closeAdd = useCallback(() => {
    setAddingPanel(null)
  }, [])

  const isAdding = useCallback(
    (panel: PanelType) => addingPanel === panel,
    [addingPanel],
  )

  return (
    <PanelAddContext.Provider
      value={{ addingPanel, openAdd, closeAdd, isAdding }}
    >
      {children}
    </PanelAddContext.Provider>
  )
}

export function usePanelAdd() {
  const context = useContext(PanelAddContext)
  if (!context) {
    throw new Error("usePanelAdd must be used within a PanelAddProvider")
  }
  return context
}
