"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { GripVertical, Pencil, Plus, Search, Trash } from "lucide-react"
import { nanoid } from "nanoid"
import SortableJS from "sortablejs"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"
import Panel from "./Panel"
import Modal from "../modals/Modal"
import { Select } from "../ui/Select"
import { Controller, useForm } from "react-hook-form"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { usePanelAdd } from "@/context/PanelAddContext"

export enum LinkCategory {
  WORK = "WORK",
  PERSONAL = "PERSONAL",
  STUDY = "STUDY",
  OTHER = "OTHER",
}

export type LinkType = {
  id: string
  category: LinkCategory
  url: string
  title: string
}

type LinkFormData = Omit<LinkType, "id">

const categoryColors: Record<LinkCategory, string> = {
  [LinkCategory.WORK]: "bg-blue-500",
  [LinkCategory.PERSONAL]: "bg-green-500",
  [LinkCategory.STUDY]: "bg-yellow-500",
  [LinkCategory.OTHER]: "bg-gray-500",
}

const categoryOptions = Object.values(LinkCategory).map((cat) => ({
  value: cat,
  label: cat.charAt(0) + cat.slice(1).toLowerCase(),
}))

export function LinksPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const { value: links, setValue: setLinks } = useLocalStorageState<LinkType[]>(
    "links",
    [],
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const { isAdding, openAdd, closeAdd } = usePanelAdd()
  const addingLink = isAdding("links")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const { register, control, handleSubmit, reset } = useForm<LinkFormData>()

  const handleSortEnd = useCallback(
    (evt: SortableJS.SortableEvent) => {
      setLinks((prev) => {
        const newLinks = [...prev]
        const [movedItem] = newLinks.splice(evt.oldIndex!, 1)
        newLinks.splice(evt.newIndex!, 0, movedItem)
        return newLinks
      })
    },
    [setLinks],
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
    setLinks(links.filter((link) => link.id !== id))
  }

  const handleAddLink = (data: LinkFormData) => {
    const { category, url, title } = data
    setLinks([...links, { id: nanoid(), category, url, title }])
    closeAdd()
  }

  const handleEditLink = (data: LinkFormData) => {
    const { category, url, title } = data
    const newLinks = [...links]
    const index = newLinks.findIndex((link) => link.id === editingId!)
    newLinks[index] = { id: editingId!, category, url, title }
    setLinks(newLinks)
    setEditingId(null)
  }

  const filteredLinks = useMemo(() => {
    if (searchQuery.trim() === "") return links
    const fuse = new Fuse(links, {
      keys: ["description", "url", "category"],
      threshold: 0.3,
    })
    return fuse.search(searchQuery).map((result) => result.item)
  }, [links, searchQuery])

  return (
    <Panel>
      <div className="flex gap-4 items-center mb-4 flex-shrink-0">
        <h2 className="font-bold text-2xl flex items-center">Links</h2>

        <div className="flex w-56 items-center gap-2 mr-auto p-2 text-sm border border-[rgb(var(--border))] rounded-lg focus-within:border-[rgb(var(--border-hover))] transition-colors">
          <input
            type="text"
            placeholder="Search links..."
            className="w-full outline-none bg-transparent text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} className="text-[rgb(var(--muted))]" />
        </div>

        <Button
          onClick={() => {
            reset({ category: "" as LinkCategory, url: "", title: "" })
            openAdd("links")
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
          {filteredLinks.length > 0 ? (
            filteredLinks.map((link) => (
              <motion.li
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
                key={link.id}
              >
                <Link
                  href={link.url}
                  target="_blank"
                  className="relative overflow-hidden flex items-center p-2 rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] transition-colors"
                >
                  <div
                    className={`absolute w-2 h-full left-0 ${categoryColors[link.category]}`}
                  ></div>

                  <div className="flex gap-2 absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setEditingId(link.id)
                        reset({
                          category: link.category,
                          url: link.url,
                          title: link.title,
                        })
                      }}
                      className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(link.id)
                      }}
                      className="text-[rgb(var(--muted))] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash size={16} />
                    </button>
                  </div>

                  <GripVertical
                    size="20"
                    className="mx-1 handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors"
                  />
                  <div className="mr-auto">
                    <span className="block font-medium">{link.title}</span>
                    <span className="block text-xs text-[rgb(var(--muted))]">
                      {link.url}
                    </span>
                  </div>
                </Link>
              </motion.li>
            ))
          ) : (
            <li className="text-[rgb(var(--muted))]">No links added yet.</li>
          )}
        </AnimatePresence>
      </ul>
      <Modal
        isOpen={addingLink || editingId !== null}
        onClose={() => {
          closeAdd()
          setEditingId(null)
        }}
      >
        <h2 className="font-bold text-2xl mb-4">
          {addingLink ? "Add Link" : "Edit Link"}
        </h2>
        <form
          onSubmit={handleSubmit(addingLink ? handleAddLink : handleEditLink)}
          className="flex flex-col gap-2 p-2 w-96"
        >
          <Controller
            name="category"
            control={control}
            defaultValue={"" as LinkCategory}
            render={({ field }) => (
              <Select
                value={field.value}
                searchable
                clearable
                onChange={field.onChange}
                options={categoryOptions}
              />
            )}
          />
          <input
            {...register("title")}
            placeholder="Title"
            required
            className="p-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))]"
          />
          <input
            {...register("url")}
            type="url"
            placeholder="URL"
            required
            className="p-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--background))] text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                closeAdd()
                setEditingId(null)
              }}
              className="px-4 py-2 rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[rgb(var(--primary))] text-white hover:bg-[rgb(var(--primary-hover))] transition-colors"
            >
              {addingLink ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </Panel>
  )
}
