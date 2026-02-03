"use client"

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
  ...props
}: ButtonProps) {
  const variants = {
    primary: "border-neutral-300 hover:border-neutral-400",
    secondary: "border-neutral-200 hover:border-neutral-300",
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 p-2 rounded-lg border ${variants[variant]} transition-colors duration-200 cursor-pointer`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
