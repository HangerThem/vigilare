"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { GripVertical, Pencil, Plus, Search, Trash } from "lucide-react"
import SortableJS from "sortablejs"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"
import Panel from "./Panel"
import NoteFormModal from "../modals/NoteFormModal"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { useModalOpen } from "@/context/ModalOpenContext"
import { Input } from "../ui/Input"

export enum NoteCategory {
  WORK = "WORK",
  PERSONAL = "PERSONAL",
  STUDY = "STUDY",
  OTHER = "OTHER",
}

export type NoteType = {
  id: string
  category: NoteCategory
  title: string
  content: string
}

const categoryColors: Record<NoteCategory, string> = {
  [NoteCategory.WORK]: "bg-blue-500",
  [NoteCategory.PERSONAL]: "bg-green-500",
  [NoteCategory.STUDY]: "bg-yellow-500",
  [NoteCategory.OTHER]: "bg-gray-500",
}

export function NotesPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const { value: notes, setValue: setNotes } = useLocalStorageState<NoteType[]>(
    "notes",
    [],
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const { openModal } = useModalOpen()
  const [searchQuery, setSearchQuery] = useState<string>("")

  const handleSortEnd = useCallback(
    (evt: SortableJS.SortableEvent) => {
      setNotes((prev) => {
        const newNotes = [...prev]
        const [movedItem] = newNotes.splice(evt.oldIndex!, 1)
        newNotes.splice(evt.newIndex!, 0, movedItem)
        return newNotes
      })
    },
    [setNotes],
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

  const handleDelete = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

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
            setEditingId(null)
            openModal("notes")
          }}
          variant="secondary"
        >
          <Plus size={20} />
        </Button>
      </div>
      <ul
        className="space-y-2 overflow-auto flex-1 min-h-0 -mr-3 pr-3"
        ref={listRef}
      >
        <AnimatePresence>
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <motion.li
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
                key={note.id}
                className="relative overflow-hidden flex items-start p-2 rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] transition-colors"
              >
                <div
                  className={`absolute w-2 h-full left-0 top-0 ${categoryColors[note.category]}`}
                ></div>

                <div className="flex gap-2 absolute top-2 right-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setEditingId(note.id)
                      openModal("notes")
                    }}
                    className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(note.id)
                    }}
                    className="text-[rgb(var(--muted))] hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash size={16} />
                  </button>
                </div>

                <GripVertical
                  size="20"
                  className="mx-1 mt-1 handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors flex-shrink-0"
                />
                <div className="mr-auto min-w-0 flex-1">
                  <span className="block font-medium">{note.title}</span>
                  <span className="block text-sm text-[rgb(var(--muted))] whitespace-pre-wrap">
                    {note.content}
                  </span>
                </div>
              </motion.li>
            ))
          ) : (
            <li className="text-[rgb(var(--muted))]">No notes added yet.</li>
          )}
        </AnimatePresence>
      </ul>
      <NoteFormModal
        notes={notes}
        setNotes={setNotes}
        editingId={editingId}
        setEditingId={setEditingId}
      />
    </Panel>
  )
}
