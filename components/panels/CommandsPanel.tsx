"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Plus, Search, Terminal } from "lucide-react"
import SortableJS from "sortablejs"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"
import Panel from "./Panel"
import { useCommands } from "@/context/DataContext"
import { useModal } from "@/context/ModalContext"
import { Input } from "../ui/Input"
import CommandFormModal from "../modals/CommandFormModal"
import CommandItem from "./items/CommandItem"

export type { CommandType } from "@/context/DataContext"

export function CommandsPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const { items: commands, reorder } = useCommands()

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

  const filteredCommands = useMemo(() => {
    if (searchQuery.trim() === "") return commands
    const fuse = new Fuse(commands, {
      keys: ["title", "code", "language"],
      threshold: 0.3,
    })
    return fuse.search(searchQuery).map((result) => result.item)
  }, [commands, searchQuery])

  return (
    <Panel>
      <CommandFormModal />

      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <h2 className="font-bold text-2xl flex items-center">Commands</h2>

        <div className="flex w-56 items-center gap-2 p-2 text-sm border border-[rgb(var(--border))] rounded-lg focus-within:border-[rgb(var(--border-hover))] transition-colors mr-auto">
          <Input
            type="text"
            placeholder="Search statuses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="ghost"
          />
          <Search size={16} className="text-[rgb(var(--muted))]" />
        </div>

        <Button
          onClick={() => {
            openModal("commands")
          }}
          variant="secondary"
        >
          <Plus size={20} />
        </Button>
      </div>
      <ul
        className="relative space-y-2 overflow-auto flex-1 min-h-0 -mr-3 pr-3"
        ref={listRef}
      >
        <AnimatePresence>
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command) => (
              <CommandItem key={command.id} command={command} />
            ))
          ) : commands.length === 0 ? (
            <motion.li
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              key="no-commands"
              className="absolute inset-0 text-[rgb(var(--muted))] flex items-center justify-center"
            >
              <Terminal size={16} className="inline mr-2" />
              No commands added yet.
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
    </Panel>
  )
}
