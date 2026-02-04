"use client"

import { cn } from "@/utils/cn"
import { motion } from "framer-motion"

interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"
> {
  children: React.ReactNode
  variant?: "primary" | "secondary"
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))]",
    secondary:
      "border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] opacity-75",
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
