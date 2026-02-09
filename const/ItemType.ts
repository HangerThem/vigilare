import z from "zod"

export const ITEM_TYPE_META = {
  note: {
    label: "Note",
    style: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  },
  link: {
    label: "Link",
    style: "bg-green-500/10 text-green-500 border-green-500/30",
  },
  snippet: {
    label: "Command",
    style: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  },
  status: {
    label: "Status",
    style: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  },
} as const

export type ItemType = keyof typeof ITEM_TYPE_META

export const ItemTypeSchema = z.enum(Object.keys(ITEM_TYPE_META) as ItemType[])
