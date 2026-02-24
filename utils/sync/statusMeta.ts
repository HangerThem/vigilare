import { SyncState } from "@/types/Sync.type"
import { Cloud, CloudOff, RefreshCcw, type LucideIcon } from "lucide-react"

export const SYNC_STATUS_META: Record<
  SyncState,
  { label: string; className: string; icon: LucideIcon }
> = {
  local: {
    label: "Local",
    className: "border-[rgb(var(--border))] text-[rgb(var(--muted))]",
    icon: CloudOff,
  },
  connecting: {
    label: "Connecting",
    className: "border-amber-400/60 text-amber-300",
    icon: RefreshCcw,
  },
  synced: {
    label: "Synced",
    className: "border-emerald-500/60 text-emerald-300",
    icon: Cloud,
  },
  offline: {
    label: "Offline",
    className: "border-orange-500/60 text-orange-300",
    icon: CloudOff,
  },
  error: {
    label: "Error",
    className: "border-red-500/60 text-red-300",
    icon: CloudOff,
  },
}
