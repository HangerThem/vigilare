import z from "zod"
import { nanoid } from "nanoid"
import { CategorySchema } from "@/const/Category"
import type { Link } from "./Link.type"
import type { Note } from "./Note.type"
import type { Snippet } from "./Snippet.type"
import type { Status } from "./Status.type"

export const ItemTypeSchema = z.enum(["note", "link", "snippet", "status"])

export const ItemSchema = z.object({
  id: z.string().default(nanoid),
  title: z.string(),
  type: ItemTypeSchema,
})

export const ItemWithCategorySchema = ItemSchema.extend({
  category: CategorySchema,
})

export type ItemType = z.infer<typeof ItemTypeSchema>
export type ItemBase = z.infer<typeof ItemSchema>
export type ItemWithCategory = z.infer<typeof ItemWithCategorySchema>
export type Item = Link | Note | Snippet | Status
