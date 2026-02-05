import { GripVertical, Pencil, Trash } from "lucide-react"
import Link from "next/link"
import {
  LinkCategory,
  LinkType,
  useLinks,
} from "@/context/DataContext"
import { motion } from "framer-motion"
import { useModal } from "@/context/ModalContext"

interface LinkItemProps {
  link: LinkType
  movable?: boolean
}

const categoryColors: Record<LinkCategory, string> = {
  [LinkCategory.WORK]: "bg-blue-500",
  [LinkCategory.PERSONAL]: "bg-green-500",
  [LinkCategory.STUDY]: "bg-yellow-500",
  [LinkCategory.OTHER]: "bg-gray-500",
}

export default function LinkItem({ link, movable = true }: LinkItemProps) {
  const { setEditingId, remove } = useLinks()
  const { openModal } = useModal()

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden p-2 rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] transition-colors"
    >
      <Link href={link.url} target="_blank" className="flex items-center">
        <div className="flex gap-2 absolute top-2 right-2 items-center">
          <button
            onClick={(e) => {
              e.preventDefault()
              setEditingId(link.id)
              openModal("links")
            }}
            className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault()
              remove(link.id)
            }}
            className="text-[rgb(var(--muted))] hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash size={16} />
          </button>
        </div>

        <div
          className={`absolute w-2 h-full left-0 ${categoryColors[link.category]}`}
        ></div>

        {movable && (
          <GripVertical
            size="20"
            className="mx-1 handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors"
          />
        )}

        <div className={!movable ? "ml-2" : "mr-auto min-w-0 flex-1"}>
          <span className="block font-medium">{link.title}</span>
          <span className="block text-xs text-[rgb(var(--muted))]">
            {link.url}
          </span>
        </div>
      </Link>
    </motion.li>
  )
}
