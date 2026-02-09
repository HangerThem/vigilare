import {
  GripVertical,
  Pencil,
  SquareArrowOutUpRight,
  Trash,
} from "lucide-react"
import {
  NoteCategory,
  NoteType,
  useCommands,
  useLinks,
  useNotes,
  useStatuses,
} from "@/context/DataContext"
import { motion } from "framer-motion"
import { useModal } from "@/context/ModalContext"
import { useSettings } from "@/context/SettingsContext"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

interface NoteItemProps {
  note: NoteType
  movable?: boolean
  compact?: boolean
}

const categoryColors: Record<NoteCategory, string> = {
  [NoteCategory.WORK]: "bg-blue-500",
  [NoteCategory.PERSONAL]: "bg-green-500",
  [NoteCategory.STUDY]: "bg-yellow-500",
  [NoteCategory.OTHER]: "bg-gray-500",
}

export default function NoteItem({
  note,
  movable = true,
  compact: compactProp,
}: NoteItemProps) {
  const { setEditingId, remove, getById } = useNotes()
  const { setEditingId: setCommandEditingId, getById: getCommandById } =
    useCommands()
  const { setEditingId: setLinkEditingId, getById: getLinkById } = useLinks()
  const { setEditingId: setStatusEditingId, getById: getStatusById } =
    useStatuses()
  const { openModal } = useModal()
  const { settings } = useSettings()

  const compact = compactProp ?? settings.compactMode

  const transformUrl = (url?: string) => {
    if (!url) return ""
    if (url.startsWith("backlink:")) return url
    if (/^(https?:|mailto:|tel:)/i.test(url)) return url
    if (
      url.startsWith("/") ||
      url.startsWith("#") ||
      url.startsWith("./") ||
      url.startsWith("../")
    ) {
      return url
    }
    if (!/^[a-zA-Z][a-zA-Z+.-]*:/.test(url)) {
      return url
    }
    return ""
  }

  function getBacklinkLabel(type: string, id: string) {
    switch (type) {
      case "note":
        return getById(id)?.title
      case "command":
        return getCommandById(id)?.title
      case "link":
        return getLinkById(id)?.title
      case "status":
        return getStatusById(id)?.title
      default:
        return null
    }
  }

  function renderReferences(content: string) {
    const withBacklinks = content.replace(
      /\[\[(note|command|link|status):([^\]]+)\]\]/g,
      (_, type, id) => {
        const label = getBacklinkLabel(type, id) ?? `${type}:${id}`
        return `[${label}](backlink:${type}:${id})`
      },
    )

    return withBacklinks.replace(
      /\[\[([^\]]+)\]\]/g,
      (_, title) => `<span class="note-ref">${title}</span>`,
    )
  }

  function openBacklink(type: string, id: string) {
    switch (type) {
      case "note":
        setEditingId(id)
        openModal("notes")
        return
      case "command":
        setCommandEditingId(id)
        openModal("commands")
        return
      case "link":
        setLinkEditingId(id)
        openModal("links")
        return
      case "status":
        setStatusEditingId(id)
        openModal("status")
        return
    }
  }

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
        className={`absolute ${compact ? "w-1.5" : "w-2"} h-full left-0 top-0 ${categoryColors[note.category]}`}
      ></div>

      {movable && (
        <GripVertical
          size={compact ? 16 : 20}
          className="mx-1 mt-1 handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors flex-shrink-0"
        />
      )}

      <div className={!movable ? "ml-2" : "mr-auto min-w-0 flex-1"}>
        <span className={`block font-medium ${compact ? "text-sm" : ""}`}>
          {note.title}
        </span>
        {!compact && (
          <div className="block text-sm text-[rgb(var(--muted))] overflow-hidden leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              urlTransform={transformUrl}
              components={{
                a: ({ children, href, ...props }) => {
                  const match = href?.match(
                    /^backlink:(note|command|link|status):(.+)$/,
                  )
                  if (match) {
                    return (
                      <button
                        type="button"
                        onClick={() => openBacklink(match[1], match[2])}
                        className="underline text-[rgb(var(--primary))] underline-offset-2 cursor-pointer"
                      >
                        {children}
                      </button>
                    )
                  }
                  return (
                    <a
                      {...props}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[rgb(var(--primary))] underline underline-offset-2"
                    >
                      {children}{" "}
                      <SquareArrowOutUpRight
                        size={12}
                        className="inline mb-0.5"
                      />
                    </a>
                  )
                },
                span: ({ children, className, ...props }) => (
                  <span
                    {...props}
                    className={`text-blue-500 underline ${className ?? ""}`}
                  >
                    {children}
                  </span>
                ),
                ul: ({ children, ...props }) => (
                  <ul {...props} className="list-disc pl-5 my-1 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol {...props} className="list-decimal pl-5 my-1 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }) => (
                  <li {...props} className="leading-relaxed">
                    {children}
                  </li>
                ),
                p: ({ children, ...props }) => (
                  <p {...props} className="my-1">
                    {children}
                  </p>
                ),
              }}
            >
              {renderReferences(note.content)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.li>
  )
}
