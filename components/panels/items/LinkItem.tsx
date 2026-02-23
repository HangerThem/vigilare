import {
  GripVertical,
  Pencil,
  SquareArrowOutUpRight,
  Trash,
} from "lucide-react"
import { useLinks } from "@/context/DataContext"
import { motion } from "framer-motion"
import { useModal } from "@/context/ModalContext"
import LinkWithSettings from "@/components/common/LinkWithSettings"
import { useSettings } from "@/context/SettingsContext"
import { Link } from "@/types/Link.type"
import { CATEGORY_META } from "@/const/Category"
import { useMemo, useState } from "react"
import Image from "next/image"

interface LinkItemProps {
  link: Link
}

const failedFavicons = new Set<string>()

export default function LinkItem({ link }: LinkItemProps) {
  const { setEditingId, remove } = useLinks()
  const { openModal } = useModal()
  const { settings } = useSettings()
  const [failedCurrentFavicon, setFailedCurrentFavicon] = useState<
    string | null
  >(null)

  const faviconUrl = useMemo(() => {
    try {
      return `/favicon?domain=${new URL(link.url).hostname}`
    } catch (e) {
      console.error("Invalid URL for favicon:", link.url, e)
      return ""
    }
  }, [link.url])

  const compact = settings.compactMode
  const showFavicon =
    faviconUrl !== "" &&
    failedCurrentFavicon !== faviconUrl &&
    !failedFavicons.has(faviconUrl)

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center relative overflow-hidden rounded-lg border border-[rgb(var(--border))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--card))] transition-colors ${compact ? "p-1.5" : "p-2"}`}
    >
      <div
        className={`flex gap-2 absolute ${compact ? "top-1.5 right-1.5" : "top-2 right-2"} items-center`}
      >
        <button
          onClick={(e) => {
            e.preventDefault()
            setEditingId(link.id)
            openModal("links")
          }}
          className="text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors cursor-pointer"
        >
          <Pencil size={compact ? 14 : 16} />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault()
            remove(link.id)
          }}
          className="text-[rgb(var(--muted))] hover:text-red-500 transition-colors cursor-pointer"
        >
          <Trash size={compact ? 14 : 16} />
        </button>
      </div>

      <div
        className={`absolute ${compact ? "w-1.5" : "w-2"} h-full left-0`}
        style={{ backgroundColor: CATEGORY_META[link.category].color }}
      />

      <GripVertical
        size={compact ? 16 : 20}
        className="mx-1 handle cursor-move text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors"
      />

      <div className="mr-auto min-w-0 flex-1">
        <LinkWithSettings
          href={link.url}
          className={`w-fit flex items-center gap-1 block font-medium ${compact ? "text-sm" : ""}`}
        >
          {showFavicon && (
            <Image
              src={faviconUrl}
              alt="favicon"
              width={16}
              height={16}
              className="inline mr-1"
              onError={() => {
                failedFavicons.add(faviconUrl)
                setFailedCurrentFavicon(faviconUrl)
              }}
              unoptimized
            />
          )}
          {link.title}

          <SquareArrowOutUpRight size={compact ? 14 : 16} />
        </LinkWithSettings>
        {!compact && (
          <span className="block text-xs text-[rgb(var(--muted))]">
            {link.url}
          </span>
        )}
      </div>
    </motion.li>
  )
}
