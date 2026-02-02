"use client"

import { useEffect, useRef, useState } from "react"
import { GripVertical, Plus, Trash, Pencil } from "lucide-react"
import { nanoid } from "nanoid"
import SortableJS from "sortablejs"
import { Button } from "../ui/Button"

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
  const [notes, setNotes] = useState<NoteType[]>(() => {
    const savedNotes = localStorage.getItem("notes")
    return savedNotes ? JSON.parse(savedNotes) : []
  })

  const [addingNote, setAddingNote] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (listRef.current) {
      const sortable = SortableJS.create(listRef.current, {
        animation: 150,
        handle: ".handle",
        onEnd: (evt) => {
          setNotes((prevNotes) => {
            const newNotes = [...prevNotes]
            const [movedItem] = newNotes.splice(evt.oldIndex!, 1)
            newNotes.splice(evt.newIndex!, 0, movedItem)
            return newNotes
          })
        },
      })

      return () => {
        sortable.destroy()
      }
    }
  }, [])

  const handleDelete = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))
  }

  const handleAddNote = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const category = formData.get("category") as NoteCategory
    const title = formData.get("title") as string
    const content = formData.get("content") as string
    setNotes([...notes, { id: nanoid(), category, title, content }])
    e.currentTarget.reset()
    setAddingNote(false)
  }

  const handleEditNote = (
    e: React.SubmitEvent<HTMLFormElement>,
    id: string,
  ) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const category = formData.get("category") as NoteCategory
    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const newNotes = [...notes]
    const index = newNotes.findIndex((note) => note.id === id)
    newNotes[index] = { id, category, title, content }
    setNotes(newNotes)
    setEditingId(null)
  }

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes))
  }, [notes])

  return (
    <section className="w-full border-2 rounded-xl border-neutral-200 p-4 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="font-bold text-2xl flex items-center">
          <GripVertical
            size="20"
            className="mr-2 handle cursor-move text-neutral-400 hover:text-neutral-600 transition-colors inline-block"
          />
          Notes
        </h2>
        <Button onClick={() => setAddingNote(true)}>
          <Plus size={20} />
          Add note
        </Button>
      </div>
      <ul className="space-y-2 overflow-auto flex-1 min-h-0" ref={listRef}>
        {notes.length > 0 &&
          notes.map((note) => (
            <li key={note.id}>
              {editingId === note.id ? (
                <form
                  onSubmit={(e) => handleEditNote(e, note.id)}
                  className="flex flex-col gap-2 p-2 rounded-lg border border-neutral-300"
                >
                  <select
                    name="category"
                    required
                    className="p-2 border border-neutral-300 rounded-lg"
                    defaultValue={note.category}
                  >
                    {Object.values(NoteCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="title"
                    placeholder="Title"
                    required
                    defaultValue={note.title}
                    className="p-2 border border-neutral-300 rounded-lg"
                  />
                  <textarea
                    name="content"
                    placeholder="Content"
                    required
                    rows={3}
                    defaultValue={note.content}
                    className="p-2 border border-neutral-300 rounded-lg resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-lg border border-neutral-300 hover:border-neutral-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="relative overflow-hidden flex items-start p-2 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors">
                  <div
                    className={`absolute w-2 h-full left-0 top-0 ${categoryColors[note.category]}`}
                  ></div>
                  <GripVertical
                    size="20"
                    className="mx-1 mt-1 handle cursor-move text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
                  />
                  <div className="mr-auto min-w-0 flex-1">
                    <span className="block font-medium">{note.title}</span>
                    <span className="block text-sm text-neutral-600 whitespace-pre-wrap">
                      {note.content}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => setEditingId(note.id)}
                      className="p-1 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        {notes.length === 0 && !addingNote && (
          <li className="text-neutral-500">No notes added yet.</li>
        )}
      </ul>
      {addingNote && (
        <form
          onSubmit={handleAddNote}
          className="flex flex-col gap-2 p-2 rounded-lg border border-neutral-300 mt-4"
        >
          <select
            name="category"
            required
            className="p-2 border border-neutral-300 rounded-lg"
            defaultValue=""
          >
            <option value="" disabled>
              Select category
            </option>
            {Object.values(NoteCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="title"
            placeholder="Title"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <textarea
            name="content"
            placeholder="Content"
            required
            rows={3}
            className="p-2 border border-neutral-300 rounded-lg resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddingNote(false)}
              className="px-4 py-2 rounded-lg border border-neutral-300 hover:border-neutral-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
