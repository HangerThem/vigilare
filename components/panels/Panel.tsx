"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { useSettings } from "@/context/SettingsContext"

interface ModalProps {
  children: ReactNode
}

export default function Panel({ children }: ModalProps) {
  const { settings } = useSettings()

  return (
    <motion.section
      className={`w-full border-2 rounded-xl border-[rgb(var(--border))] bg-[rgb(var(--card))] ${settings.compactMode ? "p-2 sm:p-3" : "p-3 sm:p-4"} min-h-48 md:min-h-0 md:h-full flex flex-col`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {children}
    </motion.section>
  )
}
