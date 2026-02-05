"use client"

import Modal from "./Modal"
import Fuse from "fuse.js"
import { useState, useMemo, useCallback } from "react"
import {
  useLinks,
  useNotes,
  useCommands,
  useStatuses,
  LinkType,
  NoteType,
  CommandType,
  StatusType,
} from "@/context/DataContext"
import { Input } from "../ui/Input"
import { useModal } from "@/context/ModalContext"
import CommandItem from "../panels/items/CommandItem"
import NoteItem from "../panels/items/NoteItem"
import LinkItem from "../panels/items/LinkItem"
import StatusItem from "../panels/items/StatusItem"

enum ResultType {
  LINK = "link",
  NOTE = "note",
  COMMAND = "command",
  STATUS = "status",
}

type SearchResult = {
  type: ResultType
  item: LinkType | NoteType | CommandType | StatusType
}

export default function GlobalSearchModal() {
  const { isModalOpen } = useModal()
  const [query, setQuery] = useState("")
  const { items: links } = useLinks()
  const { items: notes } = useNotes()
  const { items: commands } = useCommands()
  const { items: statuses } = useStatuses()

  const isOpen = isModalOpen("globalSearch")

  const results = useMemo(() => {
    if (!isOpen) {
      return []
    }

    const effectiveQuery = query.trim()
    if (effectiveQuery === "") {
      return []
    }

    const allItems: SearchResult[] = [
      ...links.map((link) => ({ type: ResultType.LINK, item: link })),
      ...notes.map((note) => ({ type: ResultType.NOTE, item: note })),
      ...commands.map((command) => ({
        type: ResultType.COMMAND,
        item: command,
      })),
      ...statuses.map((status) => ({
        type: ResultType.STATUS,
        item: status,
      })),
    ]

    const fuse = new Fuse(allItems, {
      keys: ["item.url", "item.code", "item.title", "item.content"],
      threshold: 0.3,
    })

    return fuse.search(effectiveQuery).map((result) => result.item)
  }, [isOpen, query, links, notes, commands, statuses])

  const handleClose = useCallback(() => {
    setQuery("")
  }, [])

  return (
    <Modal name="globalSearch" onClose={handleClose}>
      <h1 className="text-2xl font-bold mb-4">Global Search</h1>
      <div className="w-200">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search links, notes, commands..."
          className="mb-4"
          autoFocus
        />

        <div className="max-h-120 overflow-y-auto pr-3">
          {results.filter((result) => result.type === ResultType.LINK).length >
            0 && (
            <>
              <h2 className="text-lg font-semibold mb-2">Links</h2>
              <ul className="space-y-2 mb-4">
                {results
                  .filter((result) => result.type === ResultType.LINK)
                  .map((result, index) => (
                    <LinkItem
                      link={result.item as LinkType}
                      key={index}
                      movable={false}
                    />
                  ))}
              </ul>
            </>
          )}
          {results.filter((result) => result.type === ResultType.NOTE).length >
            0 && (
            <>
              <h2 className="text-lg font-semibold mb-2">Notes</h2>
              <ul className="space-y-2 mb-4">
                {results
                  .filter((result) => result.type === ResultType.NOTE)
                  .map((result, index) => (
                    <NoteItem
                      note={result.item as NoteType}
                      key={index}
                      movable={false}
                    />
                  ))}
              </ul>
            </>
          )}
          {results.filter((result) => result.type === ResultType.COMMAND)
            .length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-2">Commands</h2>
              <ul className="space-y-2 mb-4">
                {results
                  .filter((result) => result.type === ResultType.COMMAND)
                  .map((result, index) => (
                    <CommandItem
                      command={result.item as CommandType}
                      key={index}
                      movable={false}
                    />
                  ))}
              </ul>
            </>
          )}
          {results.filter((result) => result.type === ResultType.STATUS)
            .length > 0 && (
            <>
              <h2 className="text-lg font-semibold mb-2">Statuses</h2>
              <ul className="space-y-2 mb-4">
                {results
                  .filter((result) => result.type === ResultType.STATUS)
                  .map((result) => (
                    <StatusItem
                      status={result.item as StatusType}
                      movable={false}
                      key={result.item.id}
                    />
                  ))}
              </ul>
            </>
          )}
          {results.length === 0 && (
            <div className="p-2 text-[rgb(var(--muted))]">
              No results found.
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
