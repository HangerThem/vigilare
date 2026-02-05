"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react"

export type ModalName =
  | "commands"
  | "links"
  | "notes"
  | "status"
  | "commandPalette"
  | "globalSearch"
  | "shortcuts"

type ModalAddContextType = {
  openModal: (modal: ModalName) => void
  closeModal: () => void
  isModalOpen: (modal: ModalName) => boolean
}

const ModalOpenContext = createContext<ModalAddContextType | null>(null)

export function ModalOpenProvider({ children }: { children: ReactNode }) {
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

export function useModalOpen() {
  const context = useContext(ModalOpenContext)
  if (!context) {
    throw new Error("useModalOpen must be used within a ModalOpenProvider")
  }
  return context
}
