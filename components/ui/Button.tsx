"use client"

import { cn } from "@/utils/cn"
import { motion } from "framer-motion"

interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"
> {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost"
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "text-[rgb(var(--background))] bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-hover))]",
    secondary:
      "text-[rgb(var(--foreground))] border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--card-hover))]",
    ghost:
      "text-[rgb(var(--foreground))] bg-transparent border-transparent p-0 rounded-none",
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border transition-colors duration-200 cursor-pointer",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
