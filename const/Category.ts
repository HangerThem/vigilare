import { z } from "zod"

export const CATEGORY_META = {
  personal: {
    name: "Personal",
    color: "#FF5733",
  },
  work: {
    name: "Work",
    color: "#33C1FF",
  },
  study: {
    name: "Study",
    color: "#33FF57",
  },
  other: {
    name: "Other",
    color: "#7a7a7a",
  },
} as const

export type Category = keyof typeof CATEGORY_META

export const CategorySchema = z.enum(Object.keys(CATEGORY_META) as Category[])
