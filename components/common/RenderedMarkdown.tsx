"use client"

import ReactMarkdown from "react-markdown"
import {
  useLinks,
  useNotes,
  useSnippets,
  useStatuses,
} from "@/context/DataContext"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { SquareArrowOutUpRight } from "lucide-react"
import { useModal } from "@/context/ModalContext"

interface RenderedMarkdownProps {
  value: string
  isPreview?: boolean
}

export function RenderedMarkdown({
  value,
  isPreview = false,
}: RenderedMarkdownProps) {
  const { setEditingId, getById } = useNotes()
  const { setEditingId: setSnippetEditingId, getById: getSnippetById } =
    useSnippets()
  const { setEditingId: setLinkEditingId, getById: getLinkById } = useLinks()
  const { setEditingId: setStatusEditingId, getById: getStatusById } =
    useStatuses()
  const { openModal } = useModal()

  const transformUrl = (url?: string) => {
    if (!url) return ""
    if (url.startsWith("backlink:")) return url
    if (/^(https?:|mailto:|tel:)/i.test(url)) return url
    if (
      url.startsWith("/") ||
      url.startsWith("#") ||
      url.startsWith("./") ||
      url.startsWith("../")
    ) {
      return url
    }
    if (!/^[a-zA-Z][a-zA-Z+.-]*:/.test(url)) {
      return url
    }
    return ""
  }

  function getBacklinkLabel(type: string, id: string) {
    switch (type) {
      case "note":
        return getById(id)?.title
      case "snippet":
        return getSnippetById(id)?.title
      case "link":
        return getLinkById(id)?.title
      case "status":
        return getStatusById(id)?.title
      default:
        return null
    }
  }

  function renderReferences(content: string) {
    const withBacklinks = content.replace(
      /\[\[(note|command|link|status):([^\]]+)\]\]/g,
      (_, type, id) => {
        const label = getBacklinkLabel(type, id) ?? `${type}:${id}`
        return `[${label}](backlink:${type}:${id})`
      },
    )

    return withBacklinks.replace(
      /\[\[([^\]]+)\]\]/g,
      (_, title) => `<span class="note-ref">${title}</span>`,
    )
  }

  function openBacklink(type: string, id: string) {
    switch (type) {
      case "note":
        setEditingId(id)
        openModal("notes")
        return
      case "snippet":
        setSnippetEditingId(id)
        openModal("snippets")
        return
      case "link":
        setLinkEditingId(id)
        openModal("links")
        return
      case "status":
        setStatusEditingId(id)
        openModal("status")
        return
    }
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      urlTransform={transformUrl}
      components={{
        a: ({ children, href, ...props }) => {
          const match = href?.match(
            /^backlink:(note|snippet|link|status):(.+)$/,
          )
          if (match) {
            if (isPreview) {
              return (
                <span className="text-[rgb(var(--primary))] underline underline-offset-2">
                  {children}
                </span>
              )
            }
            return (
              <button
                type="button"
                onClick={() => openBacklink(match[1], match[2])}
                className="underline text-[rgb(var(--primary))] underline-offset-2 cursor-pointer select-text"
              >
                {children}
              </button>
            )
          }
          if (isPreview) {
            return (
              <span className="text-[rgb(var(--primary))] underline underline-offset-2">
                {children}
              </span>
            )
          }
          return (
            <a
              {...props}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-[rgb(var(--primary))] underline underline-offset-2"
            >
              {children}{" "}
              <SquareArrowOutUpRight size={12} className="inline mb-0.5" />
            </a>
          )
        },
        span: ({ children, className, ...props }) => (
          <span
            {...props}
            className={`text-blue-500 underline ${className ?? ""}`}
          >
            {children}
          </span>
        ),
        ul: ({ children, ...props }) => (
          <ul {...props} className="list-disc pl-5 my-1 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children, ...props }) => (
          <ol {...props} className="list-decimal pl-5 my-1 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children, ...props }) => (
          <li {...props} className="leading-relaxed">
            {children}
          </li>
        ),
        p: ({ children, ...props }) => (
          <p {...props} className="my-1">
            {children}
          </p>
        ),
      }}
    >
      {renderReferences(value)}
    </ReactMarkdown>
  )
}
