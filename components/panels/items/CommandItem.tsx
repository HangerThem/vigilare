import { AnimatePresence, motion } from "framer-motion"
import hljs from "highlight.js"
import { Copy, GripVertical, Pencil, Trash } from "lucide-react"
import { CommandType, useCommands } from "@/context/DataContext"
import { useEffect, useState } from "react"
import { useModal } from "@/context/ModalContext"
import { useSettings } from "@/context/SettingsContext"

interface CommandItemProps {
  command: CommandType
  movable?: boolean
  compact?: boolean
}

export default function CommandItem({
  command,
  movable = true,
  compact: compactProp,
}: CommandItemProps) {
  const { openModal } = useModal()
  const { setEditingId, remove } = useCommands()
  const { settings } = useSettings()
  const [copied, setCopied] = useState<boolean>(false)

  const compact = compactProp ?? settings.compactMode

  const handleCopy = () => {
    navigator.clipboard.writeText(command.code)
    setCopied(true)
  }

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-center rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] transition-colors ${compact ? "p-1.5" : "p-2"}`}
    >
      <div
        className={`flex gap-2 absolute ${compact ? "top-1.5 right-1.5" : "top-2 right-2"} items-center`}
      >
        <button
          onClick={(e) => {
            e.preventDefault()
            setEditingId(command.id)
            openModal("commands")
          }}
          className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
        >
          <Pencil size={compact ? 14 : 16} />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault()
            remove(command.id)
          }}
          className="text-[rgb(var(--muted))] hover:text-red-500 transition-colors cursor-pointer"
        >
          <Trash size={compact ? 14 : 16} />
        </button>
      </div>

      {movable && (
        <GripVertical
          size={compact ? 16 : 20}
          className="mr-1 handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors"
        />
      )}

      <div className="w-full">
        <span className={`font-medium ${compact ? "text-sm" : ""}`}>
          {command.title}
        </span>

        {!compact && (
          <div className="text-sm text-[rgb(var(--muted))] border border-[rgb(var(--border))] mt-1 p-1 rounded bg-[rgb(var(--card-hover))] w-full">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[rgb(var(--muted))] block">
                {command.language}
              </span>
              <span className="flex items-center justify-center gap-1">
                <AnimatePresence>
                  {copied && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="text-xs text-[rgb(var(--muted))]"
                    >
                      Copied!
                    </motion.span>
                  )}
                </AnimatePresence>
                <button
                  onClick={handleCopy}
                  className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
                >
                  <Copy size={16} />
                </button>
              </span>
            </div>
            <code
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: hljs.highlight(command.code, {
                  language: command.language || "bash",
                }).value,
              }}
            />
          </div>
        )}
        {compact && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[rgb(var(--muted))]">
              {command.language}
            </span>
            <button
              onClick={handleCopy}
              className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
            >
              <Copy size={12} />
            </button>
            {copied && (
              <span className="text-xs text-[rgb(var(--muted))]">Copied!</span>
            )}
          </div>
        )}
      </div>
    </motion.li>
  )
}
