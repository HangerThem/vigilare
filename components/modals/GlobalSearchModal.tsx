"use client"

import Modal from "@/components/modals/Modal"
import Fuse from "fuse.js"
import { useState, useMemo, useCallback } from "react"
import {
  useLinks,
  useNotes,
  useSnippets,
  useStatuses,
} from "@/context/DataContext"
import { Input } from "@/components/ui/Input"
import { useModal } from "@/context/ModalContext"
import { useSettings } from "@/context/SettingsContext"
import { Item } from "@/types/Item.type"
import { ITEM_TYPE_META, ItemType } from "@/const/ItemType"

export default function GlobalSearchModal() {
  const { isModalOpen, openModal } = useModal()
  const [query, setQuery] = useState("")
  const { settings } = useSettings()
  const { items: links, setEditingId: setLinkEditingId } = useLinks()
  const { items: notes, setEditingId: setNoteEditingId } = useNotes()
  const { items: snippets, setEditingId: setSnippetEditingId } = useSnippets()
  const { items: statuses, setEditingId: setStatusEditingId } = useStatuses()

  const isOpen = isModalOpen("globalSearch")

  const results = useMemo(() => {
    if (!isOpen) {
      return []
    }

    let effectiveQuery = query.trim()
    if (effectiveQuery === "") {
      return []
    }

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

    let allItems: Item[] = [...links, ...notes, ...snippets, ...statuses]

    if (typeFilter) {
      allItems = allItems.filter((item) => item.type === typeFilter)
    }

    if (effectiveQuery === "") {
      return allItems
    }

    const fuse = new Fuse(allItems, {
      keys: ["url", "code", "title", "content"],
      threshold: settings.fuzzySearchThreshold,
    })

    return fuse.search(effectiveQuery).map((result) => result.item)
  }, [
    isOpen,
    query,
    links,
    notes,
    snippets,
    statuses,
    settings.fuzzySearchThreshold,
  ])

  const handleOpenResult = useCallback(
    (result: Item) => {
      switch (result.type) {
        case "note":
          setNoteEditingId(result.id)
          openModal("notes")
          break
        case "link":
          setLinkEditingId(result.id)
          openModal("links")
          break
        case "snippet":
          setSnippetEditingId(result.id)
          openModal("snippets")
          break
        case "status":
          setStatusEditingId(result.id)
          openModal("status")
          break
      }
    },
    [
      openModal,
      setSnippetEditingId,
      setLinkEditingId,
      setNoteEditingId,
      setStatusEditingId,
    ],
  )

  const handleClose = useCallback(() => {
    setQuery("")
  }, [])

  return (
    <Modal name="globalSearch" onClose={handleClose}>
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
        Global Search
      </h1>
      <div className="w-full sm:w-96 md:w-140 lg:w-200">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search links, notes, commands..."
          className="mb-3 sm:mb-4"
          autoFocus
        />

        <div className="max-h-60 sm:max-h-80 md:max-h-120 overflow-y-auto">
          {results.length === 0 && query.trim() !== "" && (
            <div className="p-2 text-[rgb(var(--muted))]">
              No results found.
            </div>
          )}

          {results.length === 0 && query.trim() === "" && (
            <div className="p-2 text-[rgb(var(--muted))]">
              Start typing to search across items.
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={`${result.type}:${result.id}`}
                  type="button"
                  onClick={() => handleOpenResult(result)}
                  className="w-full text-left rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--background))] p-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${ITEM_TYPE_META[result.type].style}`}
                    >
                      {ITEM_TYPE_META[result.type].label}
                    </span>
                    <span className="font-medium text-sm truncate">
                      {result.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
