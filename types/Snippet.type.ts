import z from "zod"
import { ItemSchema } from "./Item.type"

export const SnippetSchema = ItemSchema.extend({
  type: z.literal("snippet").default("snippet"),
  language: z.string(),
  content: z.string(),
})

export type Snippet = z.infer<typeof SnippetSchema>
