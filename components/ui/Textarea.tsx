"use client"

import { cn } from "@/utils/cn"
import { motion } from "framer-motion"
import { useRef, useEffect } from "react"

interface InputProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"
> {
  variant?: "primary" | "secondary" | "ghost"
  autoresize?: boolean
}

export function Textarea({
  variant = "primary",
  className,
  autoresize,
  ...props
}: InputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const variants = {
    primary:
      "text-[rgb(var(--foreground))] bg-[rgb(var(--background))] border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] focus:bg-[rgb(var(--background))] hover:border-[rgb(var(--border-hover))]",
    secondary:
      "text-[rgb(var(--foreground))] bg-[rgb(var(--card))] border-[rgb(var(--border))] focus:border-[rgb(var(--border-hover))] focus:bg-[rgb(var(--card-hover))] hover:border-[rgb(var(--border-hover))]",
    ghost:
      "text-[rgb(var(--foreground))] bg-transparent border-transparent p-0 rounded-none",
  }

  const resize = () => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    if (autoresize) {
      resize()
    }
  }, [autoresize, props.value])

  return (
    <motion.textarea
      ref={textareaRef}
      initial={variant !== "ghost" ? { scale: 0.95, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-2 rounded-lg border outline-none transition-colors duration-200 max-h-64",
        variants[variant],
        className,
        autoresize ? "resize-none" : "",
      )}
      {...props}
      onChange={(e) => {
        if (autoresize) resize()
        if (props.onChange) props.onChange(e)
      }}
    />
  )
}
