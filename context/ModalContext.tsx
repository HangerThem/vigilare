"use client"

import { createContext, useContext, useState, useCallback } from "react"

export type ModalName =
  | "commands"
  | "links"
  | "notes"
  | "status"
  | "commandPalette"
  | "globalSearch"
  | "shortcuts"
  | "settings"
  | "confirm"
  | "importFromText"
  | "shareDashboard"

type ModalAddContextType = {
  openModal: (modal: ModalName) => void
  closeModal: () => void
  isModalOpen: (modal: ModalName) => boolean
}

const ModalOpenContext = createContext<ModalAddContextType | null>(null)

export function ModalOpenProvider({ children }: { children: React.ReactNode }) {
  const [currentModal, setCurrentModal] = useState<ModalName | null>(null)

  const openModal = useCallback((modal: ModalName) => {
    setCurrentModal(modal)
  }, [])

  const closeModal = useCallback(() => {
    setCurrentModal(null)
  }, [])

  const isModalOpen = useCallback(
    (modal: ModalName) => currentModal === modal,
    [currentModal],
  )

  return (
    <ModalOpenContext.Provider value={{ openModal, closeModal, isModalOpen }}>
      {children}
    </ModalOpenContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalOpenContext)
  if (!context) {
    throw new Error("useModal must be used within a ModalOpenProvider")
  }
  return context
}
