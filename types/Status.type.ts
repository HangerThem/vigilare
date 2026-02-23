import z from "zod"
import { ItemSchema } from "./Item.type"
import { StateSchema } from "@/const/State"
import { StatusVariantSchema } from "@/const/StatusVariant"

export const StatusSchema = ItemSchema.extend({
  type: z.literal("status").default("status"),
  url: z.url(),
  state: StateSchema.default("unknown"),
  variant: StatusVariantSchema.optional(),
  responseTime: z.number().default(0),
  lastChecked: z.string().default(() => new Date().toISOString()),
})

export type Status = z.infer<typeof StatusSchema>
