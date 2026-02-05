"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { useModal } from "@/context/ModalContext"

interface ConfirmDialogState {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

interface ConfirmDialogContextType extends ConfirmDialogState {
  confirm: (title: string, message: string) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(
  null,
)

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { openModal, closeModal } = useModal()

  const [state, setState] = useState<ConfirmDialogState>({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  })

  const confirm = useCallback(
    (title: string, message: string): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          title,
          message,
          onConfirm: () => {
            closeModal()
            resolve(true)
          },
          onCancel: () => {
            closeModal()
            resolve(false)
          },
        })
        openModal("confirm")
      })
    },
    [openModal, closeModal],
  )

  return (
    <ConfirmDialogContext.Provider value={{ ...state, confirm }}>
      {children}
    </ConfirmDialogContext.Provider>
  )
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error(
      "useConfirmDialog must be used within ConfirmDialogProvider",
    )
  }
  return context
}
