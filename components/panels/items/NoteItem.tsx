import { GripVertical, Pencil, Trash } from "lucide-react"
import { useNotes } from "@/context/DataContext"
import { motion } from "framer-motion"
import { useModal } from "@/context/ModalContext"
import { useSettings } from "@/context/SettingsContext"
import { CATEGORY_META } from "@/const/Category"
import { Note } from "@/types/Note.type"
import { RenderedMarkdown } from "@/components/common/RenderedMarkdown"
import { OverflowTooltip } from "@/components/ui/OverflowTooltip"

interface NoteItemProps {
  note: Note
}

export default function NoteItem({ note }: NoteItemProps) {
  const { setEditingId, remove } = useNotes()
  const { openModal } = useModal()
  const { settings } = useSettings()

  const compact = settings.compactMode

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2 }}
      key={note.id}
      className={`relative overflow-hidden flex items-center rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] transition-colors ${compact ? "p-1.5" : "p-2"}`}
    >
      <div
        className={`flex gap-2 absolute ${compact ? "top-1.5 right-1.5" : "top-2 right-2"}`}
      >
        <button
          onClick={(e) => {
            e.preventDefault()
            setEditingId(note.id)
            openModal("notes")
          }}
          className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
        >
          <Pencil size={compact ? 14 : 16} />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault()
            remove(note.id)
          }}
          className="text-[rgb(var(--muted))] hover:text-red-500 transition-colors cursor-pointer"
        >
          <Trash size={compact ? 14 : 16} />
        </button>
      </div>

      <div
        className={`absolute ${compact ? "w-1.5" : "w-2"} h-full left-0`}
        style={{ backgroundColor: CATEGORY_META[note.category].color }}
      />

      <GripVertical
        size={compact ? 16 : 20}
        className="mx-1 mt-1 handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors flex-shrink-0"
      />

      <div className="mr-auto lex-1 min-w-0 flex flex-col">
        <OverflowTooltip
          content={note.title}
          className={`font-medium mr-12 ${compact ? "text-sm" : ""}`}
        >
          {note.title}
        </OverflowTooltip>

        {!compact && (
          <div className="block text-sm text-[rgb(var(--muted))] overflow-hidden leading-relaxed">
            <RenderedMarkdown value={note.content} />
          </div>
        )}
      </div>
    </motion.li>
  )
}
