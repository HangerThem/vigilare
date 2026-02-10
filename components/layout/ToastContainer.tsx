"use client"

import { useToast } from "@/context/ToastContext"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "../ui/Button"

export function ToastContainer() {
  const { toastQueue, removeToast, pauseToast, resumeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {toastQueue.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            onMouseEnter={() => pauseToast(toast.id)}
            onMouseLeave={() => resumeToast(toast.id)}
            className="bg-[rgb(var(--card))] border-2 border-[rgb(var(--border))] text-[rgb(var(--text))] px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 w-100"
          >
            {toast.icon && (
              <div className="text-[rgb(var(--muted))]">
                <toast.icon size={20} />
              </div>
            )}
            <div>
              <span className="flex-1">{toast.message}</span>
              {toast.action && toast.actionLabel && (
                <Button
                  variant="ghost"
                  className="underline"
                  size="sm"
                  onClick={() => {
                    toast.action!()
                    removeToast(toast.id)
                  }}
                >
                  {toast.actionLabel}
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={() => removeToast(toast.id)}
              className="ml-auto"
            >
              <X size={16} />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
