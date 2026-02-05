import { AnimatePresence, motion } from "framer-motion"
import hljs from "highlight.js"
import { Copy } from "lucide-react"
import { CommandType } from "../CommandsPanel"
import { useEffect, useState } from "react"

interface CommandItemProps {
  command: CommandType
}

export default function CommandItem({ command }: CommandItemProps) {
  const [copied, setCopied] = useState<boolean>(false)

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
    <div className="w-full">
      <span className="font-medium">{command.title}</span>

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
    </div>
  )
}
