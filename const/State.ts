import { z } from "zod"

export const STATE_META = {
  up: {
    name: "Up",
    color: "#28a745",
  },
  down: {
    name: "Down",
    color: "#dc3545",
  },
  unknown: {
    name: "Unknown",
    color: "#6c757d",
  },
} as const

export type State = keyof typeof STATE_META

export const StateSchema = z.enum(Object.keys(STATE_META) as State[])
