import { createContext, useContext, useState, useRef } from "react"
import * as Icons from "lucide-react"
import { nanoid } from "nanoid/non-secure"

export type ToastCreate = {
  message: string
  action?: () => void
  actionLabel?: string
  icon?: Icons.LucideIcon
  ttl?: number
}

type Toast = ToastCreate & {
  id: string
  remaining?: number
  paused?: boolean
}

interface ToastContextType {
  addToast: (toast: ToastCreate) => void
  removeToast: (id: string) => void
  pauseToast: (id: string) => void
  resumeToast: (id: string) => void
  toastQueue: Toast[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toastQueue, setToastQueue] = useState<Toast[]>([])

  const timers = useRef<{
    [id: string]: { timeout: NodeJS.Timeout; start: number; remaining: number }
  }>({})

  const removeToast = (id: string) => {
    setToastQueue((prev) => prev.filter((toast) => toast.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id].timeout)
      delete timers.current[id]
    }
  }

  const addToast = ({
    message,
    icon,
    action,
    actionLabel,
    ttl = 3000,
  }: ToastCreate) => {
    const id = nanoid()
    const newToast: Toast = {
      id,
      message,
      icon,
      action,
      actionLabel,
      ttl,
      remaining: ttl,
      paused: false,
    }
    setToastQueue((prev) => [...prev, newToast])

    if (ttl > 0) {
      const start = Date.now()
      const timeout = setTimeout(() => removeToast(id), ttl)
      timers.current[id] = { timeout, start, remaining: ttl }
    }
  }

  const pauseToast = (id: string) => {
    setToastQueue((prev) =>
      prev.map((toast) => {
        if (toast.id === id && !toast.paused) {
          if (timers.current[id]) {
            const elapsed = Date.now() - timers.current[id].start
            const remaining = Math.max(
              0,
              timers.current[id].remaining - elapsed,
            )
            clearTimeout(timers.current[id].timeout)
            timers.current[id].remaining = remaining
          }
          return {
            ...toast,
            paused: true,
            remaining: timers.current[id]?.remaining,
          }
        }
        return toast
      }),
    )
  }

  const resumeToast = (id: string) => {
    setToastQueue((prev) =>
      prev.map((toast) => {
        if (toast.id === id && toast.paused) {
          const remaining =
            timers.current[id]?.remaining ??
            toast.remaining ??
            toast.ttl ??
            3000
          const start = Date.now()
          const timeout = setTimeout(() => removeToast(id), remaining)
          timers.current[id] = { timeout, start, remaining }
          return { ...toast, paused: false, remaining }
        }
        return toast
      }),
    )
  }

  return (
    <ToastContext.Provider
      value={{ addToast, removeToast, pauseToast, resumeToast, toastQueue }}
    >
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
