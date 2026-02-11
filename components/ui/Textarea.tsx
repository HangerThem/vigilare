"use client"

import { forwardRef, useCallback } from "react"
import { cn } from "@/utils/cn"
import { motion } from "framer-motion"
import { useRef, useEffect } from "react"

interface TextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"
> {
  variant?: "primary" | "secondary" | "ghost"
  animation?: boolean
  autoresize?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { variant = "primary", className, animation = true, autoresize, ...props },
    ref,
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null)

    const setRefs = useCallback(
      (element: HTMLTextAreaElement | null) => {
        internalRef.current = element
        if (typeof ref === "function") {
          ref(element)
        } else if (ref) {
          ref.current = element
        }
      },
      [ref],
    )

    const variants = {
      primary:
        "text-[rgb(var(--foreground))] bg-[rgb(var(--background))] border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] focus:bg-[rgb(var(--background))] hover:border-[rgb(var(--border-hover))]",
      secondary:
        "text-[rgb(var(--foreground))] bg-[rgb(var(--card))] border-[rgb(var(--border))] focus:border-[rgb(var(--border-hover))] focus:bg-[rgb(var(--card-hover))] hover:border-[rgb(var(--border-hover))]",
      ghost:
        "text-[rgb(var(--foreground))] bg-transparent border-transparent p-0 rounded-none",
    }

    const resize = () => {
      if (!internalRef.current) return
      const el = internalRef.current
      el.style.height = "auto"
      el.style.height = el.scrollHeight + 2 + "px"
    }

    useEffect(() => {
      if (autoresize) {
        resize()
      }
    }, [autoresize, props.value])

    return (
      <motion.textarea
        ref={setRefs}
        {...props}
        onChange={(e) => {
          if (autoresize) resize()
          if (props.onChange) props.onChange(e)
        }}
        {...(animation &&
          variant !== "ghost" && {
            initial: { scale: 0.95, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
          })}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-full text-base p-2 rounded-lg border transition-colors duration-200 overflow-hidden block outline-none resize-none",
          autoresize ? "overflow-y-auto max-h-64" : "",
          variants[variant],
          className,
        )}
      />
    )
  },
)

Textarea.displayName = "Textarea"
