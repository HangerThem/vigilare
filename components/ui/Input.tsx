"use client"

import { forwardRef } from "react"
import { cn } from "@/utils/cn"
import { motion } from "framer-motion"

interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"
> {
  variant?: "primary" | "secondary" | "ghost"
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = "primary", className, ...props }, ref) => {
    const variants = {
      primary:
        "text-[rgb(var(--foreground))] bg-[rgb(var(--background))] border-[rgb(var(--border))] focus:border-[rgb(var(--primary))] focus:bg-[rgb(var(--background))] hover:border-[rgb(var(--border-hover))]",
      secondary:
        "text-[rgb(var(--foreground))] bg-[rgb(var(--card))] border-[rgb(var(--border))] focus:border-[rgb(var(--border-hover))] focus:bg-[rgb(var(--card-hover))] hover:border-[rgb(var(--border-hover))]",
      ghost:
        "text-[rgb(var(--foreground))] bg-transparent border-transparent p-0 rounded-none",
    }

    return (
      <motion.input
        ref={ref}
        initial={variant !== "ghost" ? { scale: 0.95, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full p-2 rounded-lg border outline-none transition-colors duration-200",
          variants[variant],
          className,
        )}
        {...props}
      />
    )
  },
)

Input.displayName = "Input"
