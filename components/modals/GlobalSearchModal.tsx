"use client"

import { useLocalStorageState } from "@/hook/useLocalStorageState"
import Modal from "./Modal"
import Fuse from "fuse.js"
import { useState, useMemo } from "react"
import { LinkType } from "../panels/LinksPanel"
import { NoteType } from "../panels/NotesPanel"
import { CommandType } from "../panels/CommandsPanel"
import { StatusType } from "../panels/StatusPanel"

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

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

export default function GlobalSearchModal({
  isOpen,
  onClose,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState("")
  const { value: links } = useLocalStorageState<LinkType[]>("links", [])
  const { value: notes } = useLocalStorageState<NoteType[]>("notes", [])
  const { value: commands } = useLocalStorageState<CommandType[]>(
    "commands",
    [],
  )
  const { value: statuses } = useLocalStorageState<StatusType[]>("status", [])

  const results = useMemo(() => {
    if (query === "") {
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

    return fuse.search(query).map((result) => result.item)
  }, [query, links, notes, commands, statuses])

  const handleResultSelect = (result: SearchResult) => {
    switch (result.type) {
      case "link":
        window.open((result.item as LinkType).url, "_blank")
        break
      case "note":
        break
      case "command":
        navigator.clipboard.writeText((result.item as CommandType).code)
        break
      case "status":
        break
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-96">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search links, notes, commands..."
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          autoFocus
        />
        {results.filter((result) => result.type === ResultType.LINK).length >
          0 && (
          <>
            <h2 className="text-lg font-semibold mb-2">Links</h2>
            {results
              .filter((result) => result.type === ResultType.LINK)
              .map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleResultSelect(result)}
                  className="p-2 mb-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-100"
                >
                  <div className="font-medium">
                    {(result.item as LinkType).title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(result.item as LinkType).url}
                  </div>
                </div>
              ))}
          </>
        )}
        {results.filter((result) => result.type === ResultType.NOTE).length >
          0 && (
          <>
            <h2 className="text-lg font-semibold mb-2">Notes</h2>
            {results
              .filter((result) => result.type === ResultType.NOTE)
              .map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleResultSelect(result)}
                  className="p-2 mb-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-100"
                >
                  <div className="font-medium">
                    {(result.item as NoteType).title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(result.item as NoteType).content}
                  </div>
                </div>
              ))}
          </>
        )}
        {results.filter((result) => result.type === ResultType.COMMAND).length >
          0 && (
          <>
            <h2 className="text-lg font-semibold mb-2">Commands</h2>
            {results
              .filter((result) => result.type === ResultType.COMMAND)
              .map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleResultSelect(result)}
                  className="p-2 mb-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-100"
                >
                  <div className="font-medium">
                    {(result.item as CommandType).code}
                  </div>
                </div>
              ))}
          </>
        )}
        {results.filter((result) => result.type === ResultType.STATUS).length >
          0 && (
          <>
            <h2 className="text-lg font-semibold mb-2">Statuses</h2>
            {results
              .filter((result) => result.type === ResultType.STATUS)
              .map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleResultSelect(result)}
                  className="p-2 mb-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-100"
                >
                  <div className="font-medium">
                    {(result.item as StatusType).title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(result.item as StatusType).url}
                  </div>
                </div>
              ))}
          </>
        )}
        {results.length === 0 && (
          <div className="p-2 text-gray-500">No results found.</div>
        )}
      </div>
    </Modal>
  )
}
