import { Info } from "lucide-react"
import Tooltip from "./Tooltip"

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
}

export default function Toggle({
  checked,
  onChange,
  label,
  description,
}: ToggleProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm flex items-center gap-1">
        {label}
        {description && (
          <Tooltip content={description}>
            <Info size={12} className="text-[rgb(var(--muted))]" />
          </Tooltip>
        )}
      </span>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
          checked ? "bg-[rgb(var(--primary))]" : "bg-[rgb(var(--border))]"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-[rgb(var(--background))] rounded-full transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  )
}
