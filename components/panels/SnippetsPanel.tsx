"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Plus, Search, Terminal } from "lucide-react"
import SortableJS from "sortablejs"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "@/components/ui/Button"
import Panel from "@/components/panels/Panel"
import { useModal } from "@/context/ModalContext"
import { Input } from "@/components/ui/Input"
import { useSettings } from "@/context/SettingsContext"
import { useSnippets } from "@/context/DataContext"
import SnippetItem from "@/components/panels/items/SnippetItem"
import SnippetFormModal from "../modals/SnippetFormModal"

export function SnippetsPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const { items: snippets, reorder } = useSnippets()
  const { settings } = useSettings()

  const { openModal } = useModal()

  const [searchQuery, setSearchQuery] = useState<string>("")

  const handleSortEnd = useCallback(
    (evt: SortableJS.SortableEvent) => {
      reorder(evt.oldIndex!, evt.newIndex!)
    },
    [reorder],
  )

  useEffect(() => {
    if (listRef.current && !sortableRef.current) {
      sortableRef.current = SortableJS.create(listRef.current, {
        animation: 150,
        handle: ".handle",
        onEnd: handleSortEnd,
      })
    }
    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy()
        sortableRef.current = null
      }
    }
  }, [handleSortEnd])

  const filteredSnippets = useMemo(() => {
    if (searchQuery.trim() === "") return snippets
    const fuse = new Fuse(snippets, {
      keys: ["title", "content", "language"],
      threshold: settings.fuzzySearchThreshold,
    })
    return fuse.search(searchQuery).map((result) => result.item)
  }, [snippets, searchQuery, settings.fuzzySearchThreshold])

  const [showAll, setShowAll] = useState(false)

  const displayedSnippets = useMemo(() => {
    if (
      showAll ||
      settings.maxItemsPerPanel === 0 ||
      searchQuery.trim() !== ""
    ) {
      return filteredSnippets
    }
    return filteredSnippets.slice(0, settings.maxItemsPerPanel)
  }, [filteredSnippets, settings.maxItemsPerPanel, showAll, searchQuery])

  const hasMoreItems = filteredSnippets.length > displayedSnippets.length
  const hiddenCount = filteredSnippets.length - displayedSnippets.length

  return (
    <Panel>
      <SnippetFormModal />

      <div
        className={`flex flex-wrap items-center gap-2 ${settings.compactMode ? "sm:gap-3" : "sm:gap-4"} ${settings.compactMode ? "mb-2 sm:mb-3" : "mb-3 sm:mb-4"} flex-shrink-0`}
      >
        <h2
          className={`font-bold ${settings.compactMode ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"} flex items-center`}
        >
          Snippets
        </h2>

        <div className="mr-auto order-3 sm:order-2 w-full sm:w-auto sm:flex-1 sm:max-w-56 flex items-center gap-2 p-2 text-sm border border-[rgb(var(--border))] rounded-lg focus-within:border-[rgb(var(--border-hover))] transition-colors">
          <Input
            type="text"
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="ghost"
          />
          <Search size={16} className="text-[rgb(var(--muted))]" />
        </div>

        <Button
          onClick={() => {
            openModal("snippets")
          }}
          variant="secondary"
          className="order-2 sm:order-3 ml-auto sm:ml-0"
        >
          <Plus size={20} />
        </Button>
      </div>
      <ul
        className={`relative ${settings.compactMode ? "space-y-1" : "space-y-2"} overflow-auto flex-1 min-h-0 -mr-3 pr-3`}
        ref={listRef}
      >
        <AnimatePresence>
          {displayedSnippets.length > 0 ? (
            displayedSnippets.map((snippet) => (
              <SnippetItem key={snippet.id} snippet={snippet} />
            ))
          ) : snippets.length === 0 ? (
            <motion.li
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              key="no-snippets"
              className="absolute inset-0 text-[rgb(var(--muted))] flex items-center justify-center"
            >
              <Terminal size={16} className="inline mr-2" />
              No snippets added yet.
            </motion.li>
          ) : (
            <motion.li
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              key="no-results"
              className="absolute inset-0 text-[rgb(var(--muted))] flex items-center justify-center"
            >
              <Terminal size={16} className="inline mr-2" />
              No commands found.
            </motion.li>
          )}
        </AnimatePresence>
      </ul>
      {hasMoreItems && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-sm text-[rgb(var(--primary))] hover:underline cursor-pointer flex-shrink-0"
        >
          Show {hiddenCount} more item{hiddenCount > 1 ? "s" : ""}...
        </button>
      )}
      {showAll &&
        settings.maxItemsPerPanel > 0 &&
        filteredSnippets.length > settings.maxItemsPerPanel &&
        searchQuery.trim() === "" && (
          <button
            onClick={() => setShowAll(false)}
            className="mt-2 text-sm text-[rgb(var(--muted))] hover:underline cursor-pointer flex-shrink-0"
          >
            Show less
          </button>
        )}
    </Panel>
  )
}
