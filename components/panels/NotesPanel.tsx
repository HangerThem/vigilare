"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Notebook, Plus, Search } from "lucide-react"
import SortableJS from "sortablejs"
import { AnimatePresence, motion } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"
import Panel from "./Panel"
import NoteFormModal from "../modals/NoteFormModal"
import { useNotes } from "@/context/DataContext"
import { useModal } from "@/context/ModalContext"
import { Input } from "../ui/Input"
import NoteItem from "./items/NoteItem"

export type { NoteCategory, NoteType } from "@/context/DataContext"

export function NotesPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const { items: notes, reorder } = useNotes()
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

  const filteredNotes = useMemo(() => {
    if (searchQuery.trim() === "") return notes
    const fuse = new Fuse(notes, {
      keys: ["title", "content", "category"],
      threshold: 0.3,
    })
    return fuse.search(searchQuery).map((result) => result.item)
  }, [notes, searchQuery])

  return (
    <Panel>
      <NoteFormModal />

      <div className="flex gap-4 items-center mb-4 flex-shrink-0">
        <h2 className="font-bold text-2xl flex items-center">Notes</h2>

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
            openModal("notes")
          }}
          variant="secondary"
        >
          <Plus size={20} />
        </Button>
      </div>
      <ul
        className="space-y-2 relative overflow-auto flex-1 min-h-0 -mr-3 pr-3"
        ref={listRef}
      >
        <AnimatePresence>
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => <NoteItem note={note} key={note.id} />)
          ) : notes.length === 0 ? (
            <motion.li
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              key="no-commands"
              className="absolute inset-0 text-[rgb(var(--muted))] flex items-center justify-center"
            >
              <Notebook size={16} className="inline mr-2" />
              No notes added yet.
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
              <Notebook size={16} className="inline mr-2" />
              No notes found.
            </motion.li>
          )}
        </AnimatePresence>
      </ul>
    </Panel>
  )
}
