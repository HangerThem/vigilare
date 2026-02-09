import { z } from "zod"

export const STATUS_VARIANT_META = {
  website: {
    name: "Website",
  },
  api: {
    name: "API",
  },
  service: {
    name: "Service",
  },
  database: {
    name: "Database",
  },
  host: {
    name: "Host",
  },
} as const

export type StatusVariant = keyof typeof STATUS_VARIANT_META

export const StatusVariantSchema = z.enum(
  Object.keys(STATUS_VARIANT_META) as StatusVariant[],
)
