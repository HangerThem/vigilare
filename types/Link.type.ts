import z from "zod"
import { ItemWithCategorySchema } from "./Item.type"

export const LinkSchema = ItemWithCategorySchema.extend({
  type: z.literal("link").default("link"),
  url: z.url(),
})

export type Link = z.infer<typeof LinkSchema>
