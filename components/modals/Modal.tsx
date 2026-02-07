"use client"

import { ModalName, useModal } from "@/context/ModalContext"
import { useSettings } from "@/context/SettingsContext"
import { motion, AnimatePresence } from "framer-motion"
import { ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

interface ModalProps {
  name: ModalName
  onClose?: () => void
  children: ReactNode
}

export default function Modal({ name, onClose, children }: ModalProps) {
  const { isModalOpen, closeModal } = useModal()
  const { isEditingShortcut } = useSettings()
  const isOpen = isModalOpen(name)
  const onCloseRef = useRef(onClose)
  const modalRef = useRef<HTMLDivElement>(null)
  const [visualViewportHeight, setVisualViewportHeight] = useState<
    number | null
  >(null)

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
    if (!isOpen) return

    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => {
      setVisualViewportHeight(viewport.height)
    }

    viewport.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      viewport.removeEventListener("resize", handleResize)
      setVisualViewportHeight(null)
    }
  }, [isOpen, name])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (isEditingShortcut) return

      if (event.key === "Escape") {
        handleClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [handleClose, isEditingShortcut])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen, name])

  if (typeof document === "undefined") {
    return null
  }

  const modalMaxHeight = visualViewportHeight
    ? `${Math.min(visualViewportHeight * 0.9, window.innerHeight * 0.85)}px`
    : "85vh"

  return createPortal(
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isModalOpen(name) && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          style={{
            height: visualViewportHeight ? `${visualViewportHeight}px` : "100%",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            ref={modalRef}
            className="w-full sm:w-auto sm:min-w-96 sm:max-w-[calc(100vw-2rem)] overflow-auto bg-[rgb(var(--card))] text-[rgb(var(--foreground))] rounded-t-2xl sm:rounded-lg p-4 sm:p-6 border border-[rgb(var(--border))] overscroll-contain"
            style={{ maxHeight: modalMaxHeight }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-[rgb(var(--border))] rounded-full mx-auto mb-4 sm:hidden flex-shrink-0" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
