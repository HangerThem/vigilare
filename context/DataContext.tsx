"use client"

import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { createContext, useContext, useState, useCallback } from "react"
import { useConfirmDialog } from "@/context/ConfirmDialogContext"
import { useSettings } from "@/context/SettingsContext"
import { Snippet } from "@/types/Snippet.type"
import { Link } from "@/types/Link.type"
import { Note } from "@/types/Note.type"
import { Status } from "@/types/Status.type"

interface DataManager<T extends { id: string }> {
  items: T[]
  setItems: (items: T[] | ((prev: T[]) => T[])) => void
  add: (item: T) => void
  update: (id: string, updates: Partial<T>) => void
  remove: (id: string) => void
  getById: (id: string) => T | undefined
  editingId: string | null
  setEditingId: (id: string | null) => void
  editingItem: T | undefined
  reorder: (oldIndex: number, newIndex: number) => void
}

interface DataContextType {
  snippets: DataManager<Snippet>
  links: DataManager<Link>
  notes: DataManager<Note>
  statuses: DataManager<Status>
}

const DataContext = createContext<DataContextType | null>(null)

function useDataManager<T extends { id: string }>(
  storageKey: string,
  initialValue: T[],
  confirmTitle: string,
  confirmMessage: string,
): DataManager<T> {
  const { settings } = useSettings()
  const { confirm } = useConfirmDialog()
  const { value: items, setValue: setItems } = useLocalStorageState<T[]>(
    storageKey,
    initialValue,
  )
  const [editingId, setEditingId] = useState<string | null>(null)

  const add = useCallback(
    (item: T) => {
      setItems((prev) => [...prev, item])
    },
    [setItems],
  )

  const update = useCallback(
    (id: string, updates: Partial<T>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      )
    },
    [setItems],
  )

  const remove = useCallback(
    (id: string) => {
      if (settings.confirmBeforeDelete) {
        confirm(confirmTitle, confirmMessage).then((confirmed) => {
          if (confirmed) {
            setItems((prev) => prev.filter((item) => item.id !== id))
          }
        })
      } else {
        setItems((prev) => prev.filter((item) => item.id !== id))
      }
    },
    [
      setItems,
      confirm,
      confirmTitle,
      confirmMessage,
      settings.confirmBeforeDelete,
    ],
  )

  const getById = useCallback(
    (id: string) => {
      return items.find((item) => item.id === id)
    },
    [items],
  )

  const editingItem = editingId
    ? items.find((item) => item.id === editingId)
    : undefined

  const reorder = useCallback(
    (oldIndex: number, newIndex: number) => {
      setItems((prev) => {
        const newItems = [...prev]
        const [movedItem] = newItems.splice(oldIndex, 1)
        newItems.splice(newIndex, 0, movedItem)
        return newItems
      })
    },
    [setItems],
  )

  return {
    items,
    setItems,
    add,
    update,
    remove,
    getById,
    editingId,
    setEditingId,
    editingItem,
    reorder,
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const snippets = useDataManager<Snippet>(
    "snippets",
    [],
    "Delete Snippet",
    "Are you sure you want to delete this snippet?",
  )
  const links = useDataManager<Link>(
    "links",
    [],
    "Delete Link",
    "Are you sure you want to delete this link?",
  )
  const notes = useDataManager<Note>(
    "notes",
    [],
    "Delete Note",
    "Are you sure you want to delete this note?",
  )
  const statuses = useDataManager<Status>(
    "statuses",
    [],
    "Delete Status",
    "Are you sure you want to delete this status?",
  )

  return (
    <DataContext.Provider value={{ snippets, links, notes, statuses }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

export function useSnippets() {
  const { snippets } = useData()
  return snippets
}

export function useLinks() {
  const { links } = useData()
  return links
}

export function useNotes() {
  const { notes } = useData()
  return notes
}

export function useStatuses() {
  const { statuses } = useData()
  return statuses
}
