"use client"

import { useEffect, useRef, useState } from "react"
import { GripVertical, Plus, Trash } from "lucide-react"
import { nanoid } from "nanoid"
import SortableJS from "sortablejs"
import Link from "next/link"
import { Button } from "../ui/Button"

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
  description: string
}

const categoryColors: Record<LinkCategory, string> = {
  [LinkCategory.WORK]: "bg-blue-500",
  [LinkCategory.PERSONAL]: "bg-green-500",
  [LinkCategory.STUDY]: "bg-yellow-500",
  [LinkCategory.OTHER]: "bg-gray-500",
}

export function LinksPanel() {
  const listRef = useRef<HTMLUListElement>(null)
  const [links, setLinks] = useState<LinkType[]>(() => {
    const savedLinks = localStorage.getItem("links")
    return savedLinks ? JSON.parse(savedLinks) : []
  })

  const [addingLink, setAddingLink] = useState<boolean>(false)

  useEffect(() => {
    if (listRef.current) {
      SortableJS.create(listRef.current, {
        animation: 150,
        handle: ".handle",
        onEnd: (evt) => {
          const newLinks = [...links]
          const [movedItem] = newLinks.splice(evt.oldIndex!, 1)
          newLinks.splice(evt.newIndex!, 0, movedItem)
          setLinks(newLinks)
        },
      })
    }
  }, [links])

  const handleDelete = (id: string) => {
    setLinks(links.filter((link) => link.id !== id))
  }

  const handleAddLink = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const category = formData.get("category") as LinkCategory
    const url = formData.get("url") as string
    const description = formData.get("description") as string
    setLinks([...links, { id: nanoid(), category, url, description }])
    e.currentTarget.reset()
    setAddingLink(false)
  }

  useEffect(() => {
    localStorage.setItem("links", JSON.stringify(links))
  }, [links])

  return (
    <section className="w-full border-2 rounded-xl border-neutral-200 p-4 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="font-bold text-2xl flex items-center">
          <GripVertical
            size="20"
            className="mr-2 handle cursor-move text-neutral-400 hover:text-neutral-600 transition-colors inline-block"
          />
          Links
        </h2>
        <Button onClick={() => setAddingLink(true)}>
          <Plus size={20} />
          Add link
        </Button>
      </div>
      <ul className="space-y-2 overflow-auto flex-1 min-h-0" ref={listRef}>
        {links.length > 0 &&
          links.map((link) => (
            <li key={link.id}>
              <Link
                href={link.url}
                target="_blank"
                className="relative overflow-hidden flex items-center p-2 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors"
              >
                <div
                  className={`absolute w-2 h-full left-0 ${categoryColors[link.category]}`}
                ></div>
                <GripVertical
                  size="20"
                  className="mx-1 handle cursor-move text-neutral-400 hover:text-neutral-600 transition-colors"
                />
                <div className="mr-auto">
                  <span className="block font-medium">{link.description}</span>
                  <span className="block text-xs text-neutral-500">
                    {link.url}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete(link.id)
                  }}
                  className="p-1 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors"
                >
                  <Trash size={16} />
                </button>
              </Link>
            </li>
          ))}
        {links.length === 0 && !addingLink && (
          <li className="text-neutral-500">No links added yet.</li>
        )}
      </ul>
      {addingLink && (
        <form
          onSubmit={handleAddLink}
          className="flex flex-col gap-2 p-2 rounded-lg border border-neutral-300 mt-4"
        >
          <select
            name="category"
            required
            className="p-2 border border-neutral-300 rounded-lg"
            defaultValue=""
          >
            <option value="" disabled>
              Select category
            </option>
            {Object.values(LinkCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="description"
            placeholder="Description"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <input
            type="url"
            name="url"
            placeholder="URL"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddingLink(false)}
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
