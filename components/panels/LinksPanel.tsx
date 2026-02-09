"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, Plus, Search } from "lucide-react"
import SortableJS from "sortablejs"
import { AnimatePresence, motion } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "@/components/ui/Button"
import Panel from "@/components/panels/Panel"
import LinkFormModal from "@/components/modals/LinkFormModal"
import { useLinks } from "@/context/DataContext"
import { useModal } from "@/context/ModalContext"
import { Input } from "@/components/ui/Input"
import LinkItem from "@/components/panels/items/LinkItem"
import { useSettings } from "@/context/SettingsContext"

export function LinksPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const { items: links, reorder } = useLinks()
  const { openModal } = useModal()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const { settings } = useSettings()

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

  const filteredLinks = useMemo(() => {
    if (searchQuery.trim() === "") return links
    const fuse = new Fuse(links, {
      keys: ["title", "url", "category"],
      threshold: settings.fuzzySearchThreshold,
    })
    return fuse.search(searchQuery).map((result) => result.item)
  }, [links, searchQuery, settings.fuzzySearchThreshold])

  const [showAll, setShowAll] = useState(false)

  const displayedLinks = useMemo(() => {
    if (
      showAll ||
      settings.maxItemsPerPanel === 0 ||
      searchQuery.trim() !== ""
    ) {
      return filteredLinks
    }
    return filteredLinks.slice(0, settings.maxItemsPerPanel)
  }, [filteredLinks, settings.maxItemsPerPanel, showAll, searchQuery])

  const hasMoreItems = filteredLinks.length > displayedLinks.length
  const hiddenCount = filteredLinks.length - displayedLinks.length

  return (
    <Panel>
      <LinkFormModal />

      <div
        className={`flex flex-wrap gap-2 ${settings.compactMode ? "sm:gap-3" : "sm:gap-4"} items-center ${settings.compactMode ? "mb-2 sm:mb-3" : "mb-3 sm:mb-4"} flex-shrink-0`}
      >
        <h2
          className={`font-bold ${settings.compactMode ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"} flex items-center`}
        >
          Links
        </h2>

        <div className="mr-auto order-3 sm:order-2 w-full sm:w-auto sm:flex-1 sm:max-w-56 flex items-center gap-2 p-2 text-sm border border-[rgb(var(--border))] rounded-lg focus-within:border-[rgb(var(--border-hover))] transition-colors">
          <Input
            type="text"
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="ghost"
          />
          <Search size={16} className="text-[rgb(var(--muted))]" />
        </div>

        <Button
          onClick={() => {
            openModal("links")
          }}
          variant="secondary"
          className="order-2 sm:order-3 ml-auto sm:ml-0"
        >
          <Plus size={20} />
        </Button>
      </div>
      <ul
        className={`${settings.compactMode ? "space-y-1" : "space-y-2"} relative overflow-auto flex-1 min-h-0 -mr-3 pr-3`}
        ref={listRef}
      >
        <AnimatePresence>
          {displayedLinks.length > 0 ? (
            displayedLinks.map((link) => <LinkItem link={link} key={link.id} />)
          ) : links.length === 0 ? (
            <motion.li
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              key="no-commands"
              className="absolute inset-0 text-[rgb(var(--muted))] flex items-center justify-center"
            >
              <Link size={16} className="inline mr-2" />
              No links added yet.
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
              <Link size={16} className="inline mr-2" />
              No links found.
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
        filteredLinks.length > settings.maxItemsPerPanel &&
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
