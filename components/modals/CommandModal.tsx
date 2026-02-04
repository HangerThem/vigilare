"use client"

import { AnimatePresence, motion } from "framer-motion"
import Modal from "./Modal"
import Fuse from "fuse.js"
import { useState, useMemo } from "react"

interface CommandBase {
  icon?: React.ReactNode
  name: string
}

interface CommandWithAction extends CommandBase {
  type: "action"
  action: () => void
}

export type CommandWithCommands = CommandBase & {
  type: "commands"
  commands: CommandWithAction[]
}

export type Command = CommandWithAction | CommandWithCommands

interface CommandModalProps {
  isOpen: boolean
  onClose: () => void
  commands: Command[]
}

export default function CommandModal({
  isOpen,
  onClose,
  commands,
}: CommandModalProps) {
  const [query, setQuery] = useState("")
  const [commandsState, setCommandsState] = useState<Command[]>(commands)

  const results = useMemo(() => {
    if (query === "") {
      return commandsState
    }

    const fuse = new Fuse(commands, {
      keys: ["name"],
      threshold: 0.3,
    })

    return fuse.search(query).map((result) => result.item)
  }, [query, commandsState, commands])

  const handleCommandActionSelect = (command: {
    name: string
    action: () => void
  }) => {
    command.action()
    onClose()
  }

  const handleCommandsUpdate = (newCommands: Command[]) => {
    setCommandsState(newCommands)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose()
        setCommandsState(commands)
        setQuery("")
      }}
    >
      <div className="w-96">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="w-full p-2 mb-4 border border-[rgb(var(--border))] rounded bg-[rgb(var(--background))] text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))]"
          autoFocus
        />
        <ul>
          <AnimatePresence>
            {results.map((command, index) =>
              command.type === "commands" ? (
                <motion.li
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  key={index}
                  onClick={() => handleCommandsUpdate(command.commands)}
                  className="p-2 flex items-center gap-2 cursor-pointer hover:bg-[rgb(var(--card-hover))] rounded transition-colors"
                >
                  {command.icon && <span>{command.icon}</span>}
                  {command.name}
                </motion.li>
              ) : (
                <motion.li
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  key={index}
                  onClick={() => handleCommandActionSelect(command)}
                  className="p-2 flex items-center gap-2 cursor-pointer hover:bg-[rgb(var(--card-hover))] rounded transition-colors"
                >
                  {command.icon && <span>{command.icon}</span>}
                  {command.name}
                </motion.li>
              ),
            )}
            {results.length === 0 && (
              <li className="p-2 text-[rgb(var(--muted))]">
                No commands found.
              </li>
            )}
          </AnimatePresence>
        </ul>
      </div>
    </Modal>
  )
}
