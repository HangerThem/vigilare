"use client"

import { useEffect, useRef, useState } from "react"
import { Copy, GripVertical, Pencil, Plus, Trash } from "lucide-react"
import { nanoid } from "nanoid"
import SortableJS from "sortablejs"
import hljs from "highlight.js/lib/common"
import "highlight.js/styles/github.css"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"

export type CommandType = {
  id: string
  code: string
  description: string
  language: string
}

export function CommandsPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const [commands, setCommands] = useState<CommandType[]>(() => {
    const savedCommands = localStorage.getItem("commands")
    return savedCommands ? JSON.parse(savedCommands) : []
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null)

  const [addingCommand, setAddingCommand] = useState<boolean>(false)

  const [searchQuery, setSearchQuery] = useState<string>("")

  useEffect(() => {
    if (listRef.current) {
      SortableJS.create(listRef.current, {
        animation: 150,
        handle: ".handle",
        onEnd: (evt) => {
          const newCommands = [...commands]
          const [movedItem] = newCommands.splice(evt.oldIndex!, 1)
          newCommands.splice(evt.newIndex!, 0, movedItem)
          setCommands(newCommands)
        },
      })
    }
  }, [commands, addingCommand, editingId])

  const handleDelete = (id: string) => {
    setCommands(commands.filter((command) => command.id !== id))
  }

  const handleAddCommand = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const code = formData.get("code") as string
    const description = formData.get("description") as string
    const language = formData.get("language") as string
    setCommands([...commands, { id: nanoid(), code, description, language }])
    e.currentTarget.reset()
    setAddingCommand(false)
  }

  const handleEditCommand = (
    e: React.SubmitEvent<HTMLFormElement>,
    id: string,
  ) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const code = formData.get("code") as string
    const description = formData.get("description") as string
    const language = formData.get("language") as string
    const newCommands = [...commands]
    const index = newCommands.findIndex((command) => command.id === id)
    newCommands[index] = { id, code, description, language }
    setCommands(newCommands)
    setEditingId(null)
  }

  useEffect(() => {
    localStorage.setItem("commands", JSON.stringify(commands))
  }, [commands])

  useEffect(() => {
    if (copiedCommandId) {
      const timer = setTimeout(() => {
        setCopiedCommandId(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedCommandId])

  return (
    <section className="w-full border-2 rounded-xl border-neutral-200 p-4 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="font-bold text-2xl flex items-center">
          <GripVertical
            size="20"
            className="mr-2 handle cursor-move text-neutral-400 hover:text-neutral-600 transition-colors inline-block"
          />
          Commands
        </h2>

        <input
          type="text"
          placeholder="Search commands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-500 transition-colors mr-4"
        />

        <Button onClick={() => setAddingCommand(true)}>
          <Plus size={20} />
          Add command
        </Button>
      </div>
      <ul
        className="space-y-2 overflow-auto flex-1 min-h-0 -mr-3 pr-3"
        ref={listRef}
      >
        <AnimatePresence>
          {commands.length > 0 &&
            commands
              .filter((command) => {
                if (searchQuery.trim() === "") return true
                const fuse = new Fuse(commands, {
                  keys: ["description", "code", "language"],
                  threshold: 0.3,
                })
                const results = fuse.search(searchQuery)
                return results.some((result) => result.item.id === command.id)
              })
              .map((command) => (
                <motion.li
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                  key={command.id}
                  className="relative overflow-hidden flex items-center p-2 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors"
                >
                  {editingId === command.id ? (
                    <form
                      onSubmit={(e) => handleEditCommand(e, command.id)}
                      className="w-full flex flex-col gap-2"
                    >
                      <select
                        name="language"
                        defaultValue={command.language}
                        className="p-2 border border-neutral-300 rounded-lg"
                      >
                        {hljs.listLanguages().map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                      <textarea
                        name="code"
                        defaultValue={command.code}
                        required
                        className="p-2 border border-neutral-300 rounded-lg"
                      />
                      <input
                        type="text"
                        name="description"
                        defaultValue={command.description}
                        required
                        className="p-2 border border-neutral-300 rounded-lg"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-lg border border-neutral-300 hover:border-neutral-500 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <GripVertical
                        size="20"
                        className="mr-1 handle cursor-move text-neutral-400 hover:text-neutral-600 transition-colors"
                      />
                      <div className="mr-auto w-full">
                        <span className="font-medium">
                          {command.description}
                        </span>

                        <div className="flex gap-2 absolute top-2 right-2">
                          <button
                            onClick={() => setEditingId(command.id)}
                            className="text-neutral-400 hover:text-neutral-500 transition-colors cursor-pointer"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleDelete(command.id)
                            }}
                            className="text-neutral-400 hover:text-neutral-500 transition-colors cursor-pointer"
                          >
                            <Trash size={16} />
                          </button>
                        </div>

                        <div className="text-sm text-neutral-500 border border-neutral-300 mt-1 p-1 rounded bg-neutral-100 w-full">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-neutral-400 block">
                              {command.language}
                            </span>
                            <span className="flex items-center justify-center gap-1">
                              <AnimatePresence>
                                {copiedCommandId === command.id && (
                                  <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="text-xs text-neutral-500"
                                  >
                                    Copied!
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(command.code)
                                  setCopiedCommandId(command.id)
                                }}
                                className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
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
                    </>
                  )}
                </motion.li>
              ))}
          {commands.length === 0 && !addingCommand && (
            <li className="text-neutral-500">No commands added yet.</li>
          )}
        </AnimatePresence>
      </ul>
      {addingCommand && (
        <form
          onSubmit={handleAddCommand}
          className="flex flex-col gap-2 p-2 rounded-lg border border-neutral-300 mt-4"
        >
          <select
            name="language"
            className="p-2 border border-neutral-300 rounded-lg"
            defaultValue="bash"
          >
            {hljs.listLanguages().map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <textarea
            name="code"
            placeholder="Command"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddingCommand(false)}
              className="px-4 py-2 rounded-lg border border-neutral-300 hover:border-neutral-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
