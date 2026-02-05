"use client"

import { useLocalStorageState } from "@/hook/useLocalStorageState"
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react"

export type CommandType = {
  id: string
  code: string
  title: string
  language: string
}

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

export enum NoteCategory {
  WORK = "WORK",
  PERSONAL = "PERSONAL",
  STUDY = "STUDY",
  OTHER = "OTHER",
}

export type NoteType = {
  id: string
  category: NoteCategory
  title: string
  content: string
}

export type StatusState = "up" | "down" | "unknown"

export type StatusType = {
  id: string
  url: string
  title: string
  option?: string
  state: StatusState
}

interface DataManager<T extends { id: string }> {
  items: T[]
  setItems: (items: T[] | ((prev: T[]) => T[])) => void
  add: (item: T) => void
  update: (id: string, updates: Partial<T>) => void
  remove: (id: string) => void
  getById: (id: string) => T | undefined
  editingId: string | null
  setEditingId: (id: string | null) => void
  getEditing: () => T | undefined
  reorder: (oldIndex: number, newIndex: number) => void
}

interface DataContextType {
  commands: DataManager<CommandType>
  links: DataManager<LinkType>
  notes: DataManager<NoteType>
  statuses: DataManager<StatusType>
}

const DataContext = createContext<DataContextType | null>(null)

function useDataManager<T extends { id: string }>(
  storageKey: string,
  initialValue: T[],
): DataManager<T> {
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
      setItems((prev) => prev.filter((item) => item.id !== id))
    },
    [setItems],
  )

  const getById = useCallback(
    (id: string) => {
      return items.find((item) => item.id === id)
    },
    [items],
  )

  const getEditing = useCallback(() => {
    if (!editingId) return undefined
    return items.find((item) => item.id === editingId)
  }, [items, editingId])

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
    getEditing,
    reorder,
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const commands = useDataManager<CommandType>("commands", [])
  const links = useDataManager<LinkType>("links", [])
  const notes = useDataManager<NoteType>("notes", [])
  const statuses = useDataManager<StatusType>("status", [])

  return (
    <DataContext.Provider value={{ commands, links, notes, statuses }}>
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

export function useCommands() {
  const { commands } = useData()
  return commands
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
