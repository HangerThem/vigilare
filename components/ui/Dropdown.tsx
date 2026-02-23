"use client"

import { useState, useRef, useEffect } from "react"
import { useFloating, flip, shift, autoUpdate } from "@floating-ui/react"
import { cn } from "@/utils/cn"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"

interface DropdownProps {
  trigger: React.ReactNode
  content: React.ReactNode
}

export default function Dropdown({ trigger, content }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: "bottom-end",
    onOpenChange: setIsOpen,
    transform: false,
    middleware: [flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        !refs.floating.current?.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [refs.floating])

  const canUseDOM = typeof document !== "undefined"

  return (
    <div
      ref={(node) => {
        refs.setReference(node)
        triggerRef.current = node
      }}
      className="inline-block"
      onClick={(e) => {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }}
    >
      {trigger}
      {canUseDOM &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={(node) => {
                  refs.setFloating(node)
                }}
                style={floatingStyles}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className={cn(
                  "z-50 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-2 shadow-lg pointer-events-auto",
                )}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
