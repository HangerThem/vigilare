"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useData } from "@/context/DataContext"
import { motion, AnimatePresence } from "framer-motion"

export type BacklinkTargetType = "note" | "link" | "command" | "status"

export type BacklinkTarget = {
  type: BacklinkTargetType
  id: string
  title: string
  subtitle?: string
}

const TYPE_LABELS: Record<BacklinkTargetType, string> = {
  note: "Note",
  link: "Link",
  command: "Command",
  status: "Status",
}

const TYPE_STYLES: Record<BacklinkTargetType, string> = {
  note: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  link: "bg-green-500/10 text-green-500 border-green-500/30",
  command: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  status: "bg-purple-500/10 text-purple-500 border-purple-500/30",
}

interface BacklinkPickerModalProps {
  open: boolean
  onClose: () => void
  onPick: (target: BacklinkTarget) => void
}

export default function BacklinkPickerModal({
  open,
  onClose,
  onPick,
}: BacklinkPickerModalProps) {
  const { notes, links, commands, statuses } = useData()
  const [query, setQuery] = useState("")

  const items = useMemo<BacklinkTarget[]>(() => {
    return [
      ...notes.items.map((note) => ({
        type: "note" as const,
        id: note.id,
        title: note.title,
        subtitle: note.category,
      })),
      ...links.items.map((link) => ({
        type: "link" as const,
        id: link.id,
        title: link.title,
        subtitle: link.url,
      })),
      ...commands.items.map((command) => ({
        type: "command" as const,
        id: command.id,
        title: command.title,
        subtitle: command.language,
      })),
      ...statuses.items.map((status) => ({
        type: "status" as const,
        id: status.id,
        title: status.title,
        subtitle: status.state,
      })),
    ]
  }, [notes.items, links.items, commands.items, statuses.items])

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subtitle?.toLowerCase().includes(q) ?? false) ||
        TYPE_LABELS[item.type].toLowerCase().includes(q)
      )
    })
  }, [items, query])

  useEffect(() => {
    const handleClose = () => {
      if (!open) {
        setQuery("")
      }
    }

    handleClose()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, onClose])

  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full sm:w-auto sm:min-w-96 sm:max-w-[calc(100vw-2rem)] overflow-auto bg-[rgb(var(--card))] text-[rgb(var(--foreground))] rounded-t-2xl sm:rounded-lg p-4 sm:p-6 border border-[rgb(var(--border))] overscroll-contain"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-[rgb(var(--border))] rounded-full mx-auto mb-4 sm:hidden flex-shrink-0" />
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-[rgb(var(--muted))]">
                Insert Backlink
              </h3>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="secondary" type="button" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>

            <div className="mb-3">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, links, commands, statuses..."
                autoFocus
              />
            </div>

            <div className="max-h-64 sm:max-h-80 overflow-auto space-y-2">
              {filtered.length === 0 && (
                <div className="text-sm text-[rgb(var(--muted))]">
                  No matching items.
                </div>
              )}

              {filtered.map((item) => (
                <button
                  key={`${item.type}:${item.id}`}
                  type="button"
                  onClick={() => onPick(item)}
                  className="w-full text-left rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--background))] p-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_STYLES[item.type]}`}
                    >
                      {TYPE_LABELS[item.type]}
                    </span>
                    <span className="font-medium text-sm truncate">
                      {item.title}
                    </span>
                  </div>
                  {item.subtitle && (
                    <div className="mt-1 text-xs text-[rgb(var(--muted))] truncate">
                      {item.subtitle}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
