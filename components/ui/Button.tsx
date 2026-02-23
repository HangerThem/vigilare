"use client"

import { cn } from "@/utils/cn"
import { motion } from "framer-motion"
import React, { useRef, useLayoutEffect, useState } from "react"

interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"
> {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  keepWidth?: boolean
  preventClickPropagation?: boolean
  preventClickDefault?: boolean
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  keepWidth = false,
  className,
  preventClickPropagation = true,
  preventClickDefault = true,
  onClick,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "text-[rgb(var(--background))] bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-hover))]",
    secondary:
      "text-[rgb(var(--foreground))] border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--card-hover))]",
    ghost:
      "text-[rgb(var(--foreground))] bg-transparent border-transparent p-0 rounded-none",
    danger:
      "text-[rgb(var(--background))] bg-[rgb(var(--danger))] hover:bg-[rgb(var(--danger-hover))]",
  }

  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  const buttonRef = useRef<HTMLButtonElement>(null)
  const [width, setWidth] = useState<number>()

  useLayoutEffect(() => {
    if (keepWidth && buttonRef.current) {
      setWidth(buttonRef.current.offsetWidth)
    }
  }, [keepWidth])

  return (
    <motion.button
      ref={buttonRef}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border transition-colors duration-200 cursor-pointer",
        variants[variant],
        sizes[size],
        className,
      )}
      onClick={(e) => {
        if (props.type !== "submit") {
          if (preventClickPropagation) {
            e.stopPropagation()
          }
          if (preventClickDefault) {
            e.preventDefault()
          }
        }
        if (onClick) {
          onClick(e)
        }
      }}
      style={keepWidth && width ? { width } : undefined}
      {...props}
    >
      {children}
    </motion.button>
  )
}
