"use client"

import Modal from "./Modal"
import Fuse from "fuse.js"
import { useState, useMemo } from "react"

export interface Command {
  icon?: React.ReactNode
  name: string
  action: () => void
}

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

  const results = useMemo(() => {
    if (query === "") {
      return commands
    }

    const fuse = new Fuse(commands, {
      keys: ["name"],
      threshold: 0.3,
    })

    return fuse.search(query).map((result) => result.item)
  }, [query, commands])

  const handleCommandSelect = (command: {
    name: string
    action: () => void
  }) => {
    command.action()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-96">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          autoFocus
        />
        <ul>
          {results.map((command, index) => (
            <li
              key={index}
              onClick={() => handleCommandSelect(command)}
              className="p-2 flex items-center gap-2 cursor-pointer hover:bg-gray-200 rounded"
            >
              {command.icon && <span>{command.icon}</span>}
              {command.name}
            </li>
          ))}
          {results.length === 0 && (
            <li className="p-2 text-gray-500">No commands found.</li>
          )}
        </ul>
      </div>
    </Modal>
  )
}
