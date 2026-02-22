import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createPopper } from "@popperjs/core"
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
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const openTimeout = useRef<number | null>(null)
  const closeTimeout = useRef<number | null>(null)

  useEffect(() => {
    if (!triggerRef.current || !tooltipRef.current || !isOpen) return

    const popper = createPopper(triggerRef.current, tooltipRef.current, {
      placement,
      modifiers: [{ name: "offset", options: { offset: [0, 6] } }],
    })

    return () => popper.destroy()
  }, [isOpen, placement])

  useEffect(() => {
    return () => {
      if (openTimeout.current) window.clearTimeout(openTimeout.current)
      if (closeTimeout.current) window.clearTimeout(closeTimeout.current)
    }
  }, [])

  const handleMouseEnter = () => {
    if (closeTimeout.current) window.clearTimeout(closeTimeout.current)
    openTimeout.current = window.setTimeout(() => setIsOpen(true), delay)
  }

  const handleMouseLeave = () => {
    if (openTimeout.current) window.clearTimeout(openTimeout.current)
    closeTimeout.current = window.setTimeout(() => setIsOpen(false), 100)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div ref={tooltipRef} className="z-50 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="px-2 py-1 text-xs bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded shadow-lg whitespace-nowrap"
                >
                  {content}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
