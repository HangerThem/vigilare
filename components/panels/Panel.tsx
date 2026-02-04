"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface ModalProps {
  children: ReactNode
}

export default function Panel({ children }: ModalProps) {
  return (
    <motion.section
      className="w-full border-2 rounded-xl border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 min-h-40 max-h-120 flex flex-col"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {children}
    </motion.section>
  )
}
