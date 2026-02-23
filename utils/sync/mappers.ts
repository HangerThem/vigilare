import { Link, LinkSchema } from "@/types/Link.type"
import { Note, NoteSchema } from "@/types/Note.type"
import { Snippet, SnippetSchema } from "@/types/Snippet.type"
import { Status, StatusSchema } from "@/types/Status.type"

export interface SyncDataCollections {
  links: Link[]
  notes: Note[]
  snippets: Snippet[]
  statuses: Status[]
}

export type SyncCollectionKey = keyof SyncDataCollections

export const DATA_COLLECTION_KEYS: SyncCollectionKey[] = [
  "links",
  "notes",
  "snippets",
  "statuses",
]

const LOCAL_NAMESPACE = "local"

function toStorageKey(key: SyncCollectionKey, namespace: string): string {
  if (namespace === LOCAL_NAMESPACE) {
    return key
  }

  return `instance:${namespace}:${key}`
}

export const emptySyncDataCollections = (): SyncDataCollections => ({
  links: [],
  notes: [],
  snippets: [],
  statuses: [],
})

function normalizeArray<T>(
  value: unknown,
  parser: {
    safeParse: (input: unknown) => {
      success: boolean
      data?: T
    }
  },
): T[] {
  if (!Array.isArray(value)) return []

  const normalized: T[] = []
  for (const item of value) {
    const parsed = parser.safeParse(item)
    if (parsed.success && parsed.data !== undefined) {
      normalized.push(parsed.data)
    }
  }

  return normalized
}

export function sanitizeSyncData(input: unknown): SyncDataCollections {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return emptySyncDataCollections()
  }

  const raw = input as Record<string, unknown>

  return {
    links: normalizeArray(raw.links, LinkSchema),
    notes: normalizeArray(raw.notes, NoteSchema),
    snippets: normalizeArray(raw.snippets, SnippetSchema),
    statuses: normalizeArray(raw.statuses, StatusSchema),
  }
}

export function readSyncDataFromLocalStorage(): SyncDataCollections {
  return readSyncDataFromNamespace(LOCAL_NAMESPACE)
}

export function readSyncDataFromNamespace(namespace: string): SyncDataCollections {
  if (typeof window === "undefined") {
    return emptySyncDataCollections()
  }

  const data: Record<string, unknown> = {}

  for (const key of DATA_COLLECTION_KEYS) {
    const raw = localStorage.getItem(toStorageKey(key, namespace))
    if (!raw) {
      data[key] = []
      continue
    }

    try {
      data[key] = JSON.parse(raw)
    } catch {
      data[key] = []
    }
  }

  return sanitizeSyncData(data)
}

export function writeSyncDataToLocalStorage(data: SyncDataCollections): void {
  writeSyncDataToNamespace(data, LOCAL_NAMESPACE)
}

export function writeSyncDataToNamespace(
  data: SyncDataCollections,
  namespace: string,
): void {
  if (typeof window === "undefined") return

  for (const key of DATA_COLLECTION_KEYS) {
    localStorage.setItem(
      toStorageKey(key, namespace),
      JSON.stringify(data[key]),
    )
  }
}

export function clearSyncDataNamespace(namespace: string): void {
  if (typeof window === "undefined") return

  for (const key of DATA_COLLECTION_KEYS) {
    localStorage.removeItem(toStorageKey(key, namespace))
  }
}
