import { motion } from "framer-motion"
import { GripVertical, Pencil, Trash } from "lucide-react"
import { StatusState, StatusType, useStatuses } from "@/context/DataContext"
import { useModal } from "@/context/ModalContext"
import LinkWithSettings from "@/components/common/LinkWithSettings"
import { useSettings } from "@/context/SettingsContext"

interface StatusItemProps {
  status: StatusType
  movable?: boolean
  compact?: boolean
}

const stateColors: Record<StatusState, string> = {
  up: "bg-green-500",
  down: "bg-red-500",
  unknown: "bg-gray-500",
}

export default function StatusItem({
  status,
  movable = true,
  compact: compactProp,
}: StatusItemProps) {
  const { openModal } = useModal()
  const { setEditingId, remove } = useStatuses()
  const { settings } = useSettings()

  const compact = compactProp ?? settings.compactMode

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] transition-colors ${compact ? "p-1.5" : "p-2"}`}
    >
      <LinkWithSettings href={status.url} className="flex items-center">
        <div
          className={`absolute ${compact ? "w-1.5" : "w-2"} h-full left-0 ${stateColors[status.state]}`}
        ></div>

        <div
          className={`flex gap-2 absolute ${compact ? "top-1.5 right-1.5" : "top-2 right-2"} items-center`}
        >
          <button
            onClick={(e) => {
              e.preventDefault()
              setEditingId(status.id)
              openModal("status")
            }}
            className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
          >
            <Pencil size={compact ? 14 : 16} />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault()
              remove(status.id)
            }}
            className="text-[rgb(var(--muted))] hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash size={compact ? 14 : 16} />
          </button>
        </div>

        {movable && (
          <GripVertical
            size={compact ? 16 : 20}
            className="mx-1 handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors"
          />
        )}

        <div className={!movable ? "ml-2" : "mr-auto min-w-0 flex-1"}>
          <span className={`block font-medium ${compact ? "text-sm" : ""}`}>
            {status.title}
            {status.option && (
              <span
                className={`ml-2 text-xs px-1.5 py-0.5 rounded bg-[rgb(var(--border))] text-[rgb(var(--muted))] ${compact ? "text-[10px] px-1 py-0" : ""}`}
              >
                {status.option}
              </span>
            )}
          </span>
          {!compact && (
            <span className="block text-xs text-[rgb(var(--muted))]">
              {status.url}
            </span>
          )}
        </div>
      </LinkWithSettings>
    </motion.li>
  )
}
