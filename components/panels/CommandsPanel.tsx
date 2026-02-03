"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Copy, GripVertical, Pencil, Plus, Search, Trash } from "lucide-react"
import { nanoid } from "nanoid"
import SortableJS from "sortablejs"
import hljs from "highlight.js/lib/common"
import "highlight.js/styles/github.css"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"
import Panel from "./Panel"
import Modal from "../modals/Modal"
import { Select } from "../ui/Select"
import { Controller, useForm } from "react-hook-form"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { usePanelAdd } from "@/context/PanelAddContext"

export type CommandType = {
  id: string
  code: string
  description: string
  language: string
}

type CommandFormData = Omit<CommandType, "id">

export function CommandsPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const [commands, setCommands] = useLocalStorageState<CommandType[]>(
    "commands",
    [],
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null)

  const { isAdding, openAdd, closeAdd } = usePanelAdd()
  const addingCommand = isAdding("commands")

  const [searchQuery, setSearchQuery] = useState<string>("")

  const { register, control, handleSubmit, reset } = useForm<CommandFormData>()

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

  const handleAddCommand = (data: CommandFormData) => {
    const { language, code, description } = data
    setCommands([...commands, { id: nanoid(), code, description, language }])
    closeAdd()
  }

  const handleEditCommand = (data: CommandFormData) => {
    const { language, code, description } = data
    const newCommands = [...commands]
    const index = newCommands.findIndex((command) => command.id === editingId!)
    newCommands[index] = { id: editingId!, code, description, language }
    setCommands(newCommands)
    setEditingId(null)
  }

  useEffect(() => {
    if (copiedCommandId) {
      const timer = setTimeout(() => {
        setCopiedCommandId(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copiedCommandId])

  const filteredCommands = useMemo(() => {
    if (searchQuery.trim() === "") return commands
    const fuse = new Fuse(commands, {
      keys: ["description", "code", "language"],
      threshold: 0.3,
    })
    return fuse.search(searchQuery).map((result) => result.item)
  }, [commands, searchQuery])

  return (
    <Panel>
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <h2 className="font-bold text-2xl flex items-center">Commands</h2>

        <div className="flex w-56 items-center gap-2 mr-auto p-2 text-sm border border-neutral-300 rounded-lg focus:border-neutral-500 transition-colors mr-4">
          <input
            type="text"
            placeholder="Search commands..."
            className="w-full outline-none bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} className="text-neutral-400" />
        </div>

        <Button
          onClick={() => {
            reset({ language: "", code: "", description: "" })
            openAdd("commands")
          }}
        >
          <Plus size={20} />
        </Button>
      </div>
      <ul
        className="space-y-2 overflow-auto flex-1 min-h-0 -mr-3 pr-3"
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
                className="relative overflow-hidden flex items-center p-2 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors"
              >
                <GripVertical
                  size="20"
                  className="mr-1 handle cursor-move text-neutral-400 hover:text-neutral-600 transition-colors"
                />
                <div className="mr-auto w-full">
                  <span className="font-medium">{command.description}</span>

                  <div className="flex gap-2 absolute top-2 right-2">
                    <button
                      onClick={() => {
                        setEditingId(command.id)
                        reset({
                          language: command.language,
                          code: command.code,
                          description: command.description,
                        })
                      }}
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
              </motion.li>
            ))
          ) : (
            <li className="text-neutral-500">No commands added yet.</li>
          )}
        </AnimatePresence>
      </ul>
      <Modal
        isOpen={addingCommand || editingId !== null}
        onClose={() => {
          closeAdd()
          setEditingId(null)
        }}
      >
        <h2 className="font-bold text-2xl mb-4">
          {addingCommand ? "Add Command" : "Edit Command"}
        </h2>
        <form
          onSubmit={handleSubmit(
            addingCommand ? handleAddCommand : handleEditCommand,
          )}
          className="flex flex-col gap-2 p-2 w-96"
        >
          <Controller
            name="language"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Select
                value={field.value}
                searchable
                clearable
                onChange={field.onChange}
                options={hljs.listLanguages().map((lang) => ({
                  value: lang,
                  label: lang,
                }))}
              />
            )}
          />
          <textarea
            {...register("code")}
            placeholder="Command"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <input
            {...register("description")}
            placeholder="Description"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                closeAdd()
                setEditingId(null)
              }}
              className="px-4 py-2 rounded-lg border border-neutral-300 hover:border-neutral-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {addingCommand ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </Panel>
  )
}
