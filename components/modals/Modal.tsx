"use client"

import { ModalName, useModalOpen } from "@/context/ModalOpenContext"
import { motion, AnimatePresence } from "framer-motion"
import { ReactNode, useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"

interface ModalProps {
  name: ModalName
  onClose?: () => void
  children: ReactNode
}

export default function Modal({ name, onClose, children }: ModalProps) {
  const { isModalOpen, closeModal } = useModalOpen()
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const handleClose = useCallback(() => {
    closeModal()
  }, [closeModal])

  const handleExitComplete = useCallback(() => {
    onCloseRef.current?.()
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [handleClose])

  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isModalOpen(name) && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-[rgb(var(--card))] text-[rgb(var(--foreground))] rounded-lg p-6 border border-[rgb(var(--border))]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
