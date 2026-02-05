import { motion } from "framer-motion"
import { GripVertical, Pencil, Trash } from "lucide-react"
import Link from "next/link"
import { StatusState, StatusType, useStatuses } from "@/context/DataContext"
import { useModal } from "@/context/ModalContext"

interface StatusItemProps {
  status: StatusType
  movable?: boolean
}

const stateColors: Record<StatusState, string> = {
  up: "bg-green-500",
  down: "bg-red-500",
  unknown: "bg-gray-500",
}

export default function StatusItem({
  status,
  movable = true,
}: StatusItemProps) {
  const { openModal } = useModal()
  const { setEditingId, remove } = useStatuses()

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden p-2 rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] transition-colors"
    >
      <Link href={status.url} target="_blank" className="flex items-center">
        <div
          className={`absolute w-2 h-full left-0 ${stateColors[status.state]}`}
        ></div>

        <div className="flex gap-2 absolute top-2 right-2 items-center">
          <button
            onClick={(e) => {
              e.preventDefault()
              setEditingId(status.id)
              openModal("status")
            }}
            className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault()
              remove(status.id)
            }}
            className="text-[rgb(var(--muted))] hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash size={16} />
          </button>
        </div>

        {movable && (
          <GripVertical
            size="20"
            className="mx-1 handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors"
          />
        )}

        <div className={!movable ? "ml-2" : "mr-auto min-w-0 flex-1"}>
          <span className="block font-medium">
            {status.title}
            {status.option && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--border))] text-[rgb(var(--muted))]">
                {status.option}
              </span>
            )}
          </span>
          <span className="block text-xs text-[rgb(var(--muted))]">
            {status.url}
          </span>
        </div>
      </Link>
    </motion.li>
  )
}
