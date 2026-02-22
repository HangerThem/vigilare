import React, { useEffect, useRef, useState } from "react"
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  placement?: "top" | "bottom" | "left" | "right"
  delay?: number
}

export default function Tooltip({
  children,
  content,
  placement = "top",
  delay = 0,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const openTimeout = useRef<number>(0)
  const closeTimeout = useRef<number>(0)

  const { refs, floatingStyles } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    transform: false,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  useEffect(() => {
    return () => {
      window.clearTimeout(openTimeout.current)
      window.clearTimeout(closeTimeout.current)
    }
  }, [])

  const handleMouseEnter = () => {
    window.clearTimeout(closeTimeout.current)
    openTimeout.current = window.setTimeout(() => setIsOpen(true), delay)
  }

  const handleMouseLeave = () => {
    window.clearTimeout(openTimeout.current)
    closeTimeout.current = window.setTimeout(() => setIsOpen(false), 80)
  }

  if (typeof document === "undefined") {
    return <>{children}</>
  }

  return (
    <>
      <div
        ref={(node) => refs.setReference(node)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {createPortal(
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
              className="z-50 pointer-events-none px-2 py-1 text-xs bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded shadow-lg whitespace-nowrap"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
