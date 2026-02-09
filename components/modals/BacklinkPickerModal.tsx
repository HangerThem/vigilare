"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useData } from "@/context/DataContext"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Item } from "@/types/Item.type"
import { useSettings } from "@/context/SettingsContext"
import { ITEM_TYPE_META, ItemType } from "@/const/ItemType"

export type BacklinkTarget = {
  type: ItemType
  id: string
  title: string
  subtitle?: string
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
  const { notes, links, snippets, statuses } = useData()
  const [query, setQuery] = useState("")
  const { settings } = useSettings()

  const allItems: Item[] = useMemo(
    () => [
      ...links.items,
      ...notes.items,
      ...snippets.items,
      ...statuses.items,
    ],
    [links.items, notes.items, snippets.items, statuses.items],
  )

  const filtered: Item[] = useMemo(() => {
    if (!open) return []
    let effectiveQuery = query.trim()
    if (effectiveQuery === "") return allItems

    const typeMatch = effectiveQuery.match(/^@(\w+)\s*/i)
    let typeFilter: ItemType | undefined
    if (typeMatch) {
      const typeStr = typeMatch[1].toLowerCase()
      const labelMatch = Object.entries(ITEM_TYPE_META).find(
        ([, meta]) => meta.label.toLowerCase() === typeStr,
      )
      typeFilter =
        (Object.keys(ITEM_TYPE_META) as ItemType[]).find(
          (type) => type === typeStr,
        ) ?? (labelMatch?.[0] as ItemType | undefined)
      effectiveQuery = effectiveQuery.slice(typeMatch[0].length)
    }

    if (effectiveQuery === "" && !typeFilter) {
      return []
    }

    let items = allItems
    if (typeFilter) {
      items = items.filter((item) => item.type === typeFilter)
    }

    if (effectiveQuery === "") return items

    const fuse = new Fuse(items, {
      keys: ["url", "code", "title", "content"],
      threshold: settings.fuzzySearchThreshold,
    })

    return fuse.search(effectiveQuery).map((result) => result.item)
  }, [open, query, allItems, settings.fuzzySearchThreshold])

  useEffect(() => {
    const handleClose = () => {
      if (!open) setQuery("")
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
                placeholder="Search links, notes, commands, statuses..."
                autoFocus
              />
            </div>

            <div className="max-h-64 sm:max-h-80 overflow-auto space-y-2">
              {filtered.length === 0 && (
                <div className="text-sm text-[rgb(var(--muted))]">
                  No results found.
                </div>
              )}

              {filtered.map((item) => (
                <button
                  key={`${item.type}:${item.id}`}
                  type="button"
                  onClick={() =>
                    onPick({
                      type: item.type,
                      id: item.id,
                      title: item.title,
                      subtitle: "content" in item ? item.content : undefined,
                    })
                  }
                  className="w-full text-left rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--background))] p-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${ITEM_TYPE_META[item.type].style}`}
                    >
                      {ITEM_TYPE_META[item.type].label}
                    </span>
                    <span className="font-medium text-sm truncate">
                      {item.title}
                    </span>
                  </div>
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
