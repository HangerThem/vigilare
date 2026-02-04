"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { GripVertical, Pencil, Plus, Search, Trash } from "lucide-react"
import { nanoid } from "nanoid"
import SortableJS from "sortablejs"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"
import Panel from "./Panel"
import Modal from "../modals/Modal"
import { Select } from "../ui/Select"
import { Controller, useForm } from "react-hook-form"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { usePanelAdd } from "@/context/PanelAddContext"

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

type NoteFormData = Omit<NoteType, "id">

const categoryColors: Record<NoteCategory, string> = {
  [NoteCategory.WORK]: "bg-blue-500",
  [NoteCategory.PERSONAL]: "bg-green-500",
  [NoteCategory.STUDY]: "bg-yellow-500",
  [NoteCategory.OTHER]: "bg-gray-500",
}

const categoryOptions = Object.values(NoteCategory).map((cat) => ({
  value: cat,
  label: cat.charAt(0) + cat.slice(1).toLowerCase(),
}))

export function NotesPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const { value: notes, setValue: setNotes } = useLocalStorageState<NoteType[]>(
    "notes",
    [],
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const { isAdding, openAdd, closeAdd } = usePanelAdd()
  const addingNote = isAdding("notes")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const { register, control, handleSubmit, reset } = useForm<NoteFormData>()

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

  const handleAddNote = (data: NoteFormData) => {
    const { category, title, content } = data
    setNotes([...notes, { id: nanoid(), category, title, content }])
    closeAdd()
  }

  const handleEditNote = (data: NoteFormData) => {
    const { category, title, content } = data
    const newNotes = [...notes]
    const index = newNotes.findIndex((note) => note.id === editingId!)
    newNotes[index] = { id: editingId!, category, title, content }
    setNotes(newNotes)
    setEditingId(null)
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

        <div className="flex w-56 items-center gap-2 mr-auto p-2 text-sm border border-[rgb(var(--border))] rounded-lg focus-within:border-[rgb(var(--border-hover))] transition-colors">
          <input
            type="text"
            placeholder="Search notes..."
            className="w-full outline-none bg-transparent text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} className="text-[rgb(var(--muted))]" />
        </div>

        <Button
          onClick={() => {
            reset({ category: "" as NoteCategory, title: "", content: "" })
            openAdd("notes")
          }}
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
                      reset({
                        category: note.category,
                        title: note.title,
                        content: note.content,
                      })
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
      <Modal
        isOpen={addingNote || editingId !== null}
        onClose={() => {
          closeAdd()
          setEditingId(null)
        }}
      >
        <h2 className="font-bold text-2xl mb-4">
          {addingNote ? "Add Note" : "Edit Note"}
        </h2>
        <form
          onSubmit={handleSubmit(addingNote ? handleAddNote : handleEditNote)}
          className="flex flex-col gap-2 p-2 w-96"
        >
          <Controller
            name="category"
            control={control}
            defaultValue={"" as NoteCategory}
            render={({ field }) => (
              <Select
                value={field.value}
                searchable
                clearable
                onChange={field.onChange}
                options={categoryOptions}
              />
            )}
          />
          <input
            {...register("title")}
            placeholder="Title"
            required
            className="p-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))]"
          />
          <textarea
            {...register("content")}
            placeholder="Content"
            required
            rows={3}
            className="p-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))] resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                closeAdd()
                setEditingId(null)
              }}
              className="px-4 py-2 rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-hover))] transition-colors"
            >
              {addingNote ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </Panel>
  )
}
