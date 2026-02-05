"use client"

import { AnimatePresence, motion } from "framer-motion"
import Modal from "./Modal"
import Fuse from "fuse.js"
import { useState, useMemo, useEffect, useCallback } from "react"

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
  const [selectedIndex, setSelectedIndex] = useState(0)
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

  const handleClose = useCallback(() => {
    onClose()
    setCommandsState(commands)
    setQuery("")
  }, [onClose, commands])

  const handleCommandActionSelect = useCallback(
    (command: { name: string; action: () => void }) => {
      command.action()
      handleClose()
    },
    [handleClose],
  )

  const handleCommandsUpdate = useCallback((newCommands: Command[]) => {
    setCommandsState(newCommands)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev,
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const command = results[selectedIndex]
        if (command) {
          if (command.type === "commands") {
            handleCommandsUpdate(command.commands)
            setSelectedIndex(0)
          } else {
            handleCommandActionSelect(command)
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        handleClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    isOpen,
    selectedIndex,
    results,
    handleClose,
    handleCommandActionSelect,
    handleCommandsUpdate,
  ])

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
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
          {results.map((command, index) => (
            <li
              key={index}
              onClick={() =>
                command.type === "commands"
                  ? handleCommandsUpdate(command.commands)
                  : handleCommandActionSelect(command)
              }
              onMouseEnter={() => setSelectedIndex(index)}
              className={`p-2 flex items-center gap-2 cursor-pointer rounded transition-colors ${selectedIndex === index ? "bg-[rgb(var(--card-hover))]" : ""}`}
            >
              {command.icon && <span>{command.icon}</span>}
              {command.name}
            </li>
          ))}
          {results.length === 0 && (
            <li className="p-2 text-[rgb(var(--muted))]">No commands found.</li>
          )}
        </ul>
      </div>
    </Modal>
  )
}
