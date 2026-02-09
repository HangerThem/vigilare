import z from "zod"
import { ItemSchema } from "./Item.type"
import { StateSchema } from "@/const/State"

export const StatusSchema = ItemSchema.extend({
  type: z.literal("status").default("status"),
  url: z.url(),
  state: StateSchema.default("unknown"),
  variant: z.enum([]).optional(),
})

export type Status = z.infer<typeof StatusSchema>
