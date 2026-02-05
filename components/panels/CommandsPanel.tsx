"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  GripVertical,
  Pencil,
  Plus,
  Search,
  Terminal,
  Trash,
} from "lucide-react"
import SortableJS from "sortablejs"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"
import Panel from "./Panel"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { useModalOpen } from "@/context/ModalOpenContext"
import { Input } from "../ui/Input"
import CommandFormModal from "../modals/CommandFormModal"
import CommandItem from "./items/CommandItem"

export type CommandType = {
  id: string
  code: string
  title: string
  language: string
}

export function CommandsPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const { value: commands, setValue: setCommands } = useLocalStorageState<
    CommandType[]
  >("commands", [])
  const [editingId, setEditingId] = useState<string | null>(null)

  const { openModal } = useModalOpen()

  const [searchQuery, setSearchQuery] = useState<string>("")

  const handleSortEnd = useCallback(
    (evt: SortableJS.SortableEvent) => {
      setCommands((prev) => {
        const newCommands = [...prev]
        const [movedItem] = newCommands.splice(evt.oldIndex!, 1)
        newCommands.splice(evt.newIndex!, 0, movedItem)
        return newCommands
      })
    },
    [setCommands],
  )

  useEffect(() => {
    if (listRef.current && !sortableRef.current) {
      sortableRef.current = SortableJS.create(listRef.current, {
        animation: 150,
        handle: ".handle",
        onEnd: handleSortEnd,
      })
    }
    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy()
        sortableRef.current = null
      }
    }
  }, [handleSortEnd])

  const handleDelete = (id: string) => {
    setCommands(commands.filter((command) => command.id !== id))
  }

  const filteredCommands = useMemo(() => {
    if (searchQuery.trim() === "") return commands
    const fuse = new Fuse(commands, {
      keys: ["title", "code", "language"],
      threshold: 0.3,
    })
    return fuse.search(searchQuery).map((result) => result.item)
  }, [commands, searchQuery])

  return (
    <Panel>
      <CommandFormModal
        commands={commands}
        setCommands={setCommands}
        editingId={editingId}
        setEditingId={setEditingId}
      />

      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <h2 className="font-bold text-2xl flex items-center">Commands</h2>

        <div className="flex w-56 items-center gap-2 p-2 text-sm border border-[rgb(var(--border))] rounded-lg focus-within:border-[rgb(var(--border-hover))] transition-colors mr-auto">
          <Input
            type="text"
            placeholder="Search statuses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="ghost"
          />
          <Search size={16} className="text-[rgb(var(--muted))]" />
        </div>

        <Button
          onClick={() => {
            setEditingId(null)
            openModal("commands")
          }}
          variant="secondary"
        >
          <Plus size={20} />
        </Button>
      </div>
      <ul
        className="relative space-y-2 overflow-auto flex-1 min-h-0 -mr-3 pr-3"
        ref={listRef}
      >
        <AnimatePresence>
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command) => (
              <motion.li
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
                key={command.id}
                className="relative overflow-hidden flex items-center p-2 rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] transition-colors"
              >
                <GripVertical
                  size="20"
                  className="mr-1 ml-auto handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors"
                />
                <div className="flex gap-2 absolute top-2 right-2">
                  <button
                    onClick={() => {
                      setEditingId(command.id)
                      openModal("commands")
                    }}
                    className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(command.id)
                    }}
                    className="text-[rgb(var(--muted))] hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash size={16} />
                  </button>
                </div>

                <CommandItem command={command} />
              </motion.li>
            ))
          ) : commands.length === 0 ? (
            <motion.li
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              key="no-commands"
              className="absolute inset-0 text-[rgb(var(--muted))] flex items-center justify-center"
            >
              <Terminal size={16} className="inline mr-2" />
              No commands added yet.
            </motion.li>
          ) : (
            <motion.li
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              key="no-results"
              className="absolute inset-0 text-[rgb(var(--muted))] flex items-center justify-center"
            >
              <Terminal size={16} className="inline mr-2" />
              No commands found.
            </motion.li>
          )}
        </AnimatePresence>
      </ul>
    </Panel>
  )
}
