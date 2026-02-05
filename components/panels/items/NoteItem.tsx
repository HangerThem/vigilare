import { GripVertical, Pencil, Trash } from "lucide-react"
import {
  NoteCategory,
  NoteType,
  useNotes,
} from "@/context/DataContext"
import { motion } from "framer-motion"
import { useModal } from "@/context/ModalContext"

interface NoteItemProps {
  note: NoteType
  movable?: boolean
}

const categoryColors: Record<NoteCategory, string> = {
  [NoteCategory.WORK]: "bg-blue-500",
  [NoteCategory.PERSONAL]: "bg-green-500",
  [NoteCategory.STUDY]: "bg-yellow-500",
  [NoteCategory.OTHER]: "bg-gray-500",
}

export default function NoteItem({ note, movable = true }: NoteItemProps) {
  const { setEditingId, remove } = useNotes()
  const { openModal } = useModal()

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2 }}
      key={note.id}
      className="relative overflow-hidden flex items-center p-2 rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] transition-colors"
    >
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
            remove(note.id)
          }}
          className="text-[rgb(var(--muted))] hover:text-red-500 transition-colors cursor-pointer"
        >
          <Trash size={16} />
        </button>
      </div>

      <div
        className={`absolute w-2 h-full left-0 top-0 ${categoryColors[note.category]}`}
      ></div>

      {movable && (
        <GripVertical
          size="20"
          className="mx-1 mt-1 handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors flex-shrink-0"
        />
      )}

      <div className={!movable ? "ml-2" : "mr-auto min-w-0 flex-1"}>
        <span className="block font-medium">{note.title}</span>
        <span className="block text-sm text-[rgb(var(--muted))] whitespace-pre-wrap">
          {note.content}
        </span>
      </div>
    </motion.li>
  )
}
