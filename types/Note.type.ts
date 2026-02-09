import z from "zod"
import { ItemWithCategorySchema } from "./Item.type"

export const NoteSchema = ItemWithCategorySchema.extend({
  type: z.literal("note").default("note"),
  content: z.string(),
})

export type Note = z.infer<typeof NoteSchema>
