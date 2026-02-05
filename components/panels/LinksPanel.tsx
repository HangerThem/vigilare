"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { GripVertical, Pencil, Plus, Search, Trash } from "lucide-react"
import SortableJS from "sortablejs"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"
import Panel from "./Panel"
import LinkFormModal from "../modals/LinkFormModal"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { useModalOpen } from "@/context/ModalOpenContext"
import { Input } from "../ui/Input"

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

const categoryColors: Record<LinkCategory, string> = {
  [LinkCategory.WORK]: "bg-blue-500",
  [LinkCategory.PERSONAL]: "bg-green-500",
  [LinkCategory.STUDY]: "bg-yellow-500",
  [LinkCategory.OTHER]: "bg-gray-500",
}

export function LinksPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const { value: links, setValue: setLinks } = useLocalStorageState<LinkType[]>(
    "links",
    [],
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const { openModal } = useModalOpen()
  const [searchQuery, setSearchQuery] = useState<string>("")

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
            openModal("links")
          }}
          variant="secondary"
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
                        openModal("links")
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
      <LinkFormModal
        links={links}
        setLinks={setLinks}
        editingId={editingId}
        setEditingId={setEditingId}
      />
    </Panel>
  )
}
