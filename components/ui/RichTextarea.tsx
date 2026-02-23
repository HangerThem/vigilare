"use client"

import { forwardRef, useCallback, useEffect, useRef, useState } from "react"
import type React from "react"
import {
  Bold,
  Code2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline,
  Eye,
  EyeOff,
} from "lucide-react"
import { Textarea } from "@/components/ui/Textarea"
import { useSettings } from "@/context/SettingsContext"
import { RenderedMarkdown } from "@/components/common/RenderedMarkdown"
import { Button } from "./Button"
import Tooltip from "./Tooltip"

interface RichTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"
> {
  variant?: "primary" | "secondary" | "ghost"
  autoresize?: boolean
  onBacklinkRequest?: (range: { start: number; end: number }) => void
}

const PAIR_CHARS = new Set(["*", "_"])
const INDENT_SIZE = 2

function getLineStart(value: string, position: number) {
  const idx = value.lastIndexOf("\n", position - 1)
  return idx === -1 ? 0 : idx + 1
}

function getLineEnd(value: string, position: number) {
  const idx = value.indexOf("\n", position)
  return idx === -1 ? value.length : idx
}

function countRun(value: string, start: number, direction: 1 | -1, ch: string) {
  let count = 0
  let i = start
  while (i >= 0 && i < value.length && value[i] === ch) {
    count += 1
    i += direction
  }
  return count
}

function isListLine(line: string) {
  return /^(\s*)([-*])\s+/.test(line)
}

function isOrderedLine(line: string) {
  return /^(\s*)(\d+)\.\s+/.test(line)
}

export function handleBold(
  value: string,
  start: number,
  end: number,
  applyChange: (nextValue: string, nextStart: number, nextEnd?: number) => void,
) {
  const marker = "**"
  const markerLen = marker.length
  if (start !== end) {
    const before = value.slice(start - markerLen, start)
    const after = value.slice(end, end + markerLen)
    if (before === marker && after === marker) {
      const nextValue =
        value.slice(0, start - markerLen) +
        value.slice(start, end) +
        value.slice(end + markerLen)
      applyChange(nextValue, start - markerLen, end - markerLen)
      return
    }
    const nextValue =
      value.slice(0, start) +
      marker +
      value.slice(start, end) +
      marker +
      value.slice(end)
    applyChange(nextValue, start + markerLen, end + markerLen)
    return
  }
  const before = value.slice(start - markerLen, start)
  const after = value.slice(start, start + markerLen)
  if (before === marker && after === marker) {
    const nextValue =
      value.slice(0, start - markerLen) + value.slice(start + markerLen)
    applyChange(nextValue, start - markerLen)
    return
  }
  const nextValue = value.slice(0, start) + marker + marker + value.slice(start)
  applyChange(nextValue, start + markerLen)
}

export function handleItalic(
  value: string,
  start: number,
  end: number,
  applyChange: (nextValue: string, nextStart: number, nextEnd?: number) => void,
) {
  const marker = "*"
  const markerLen = marker.length
  if (start !== end) {
    const before = value.slice(start - markerLen, start)
    const after = value.slice(end, end + markerLen)
    if (before === marker && after === marker) {
      const nextValue =
        value.slice(0, start - markerLen) +
        value.slice(start, end) +
        value.slice(end + markerLen)
      applyChange(nextValue, start - markerLen, end - markerLen)
      return
    }
    const nextValue =
      value.slice(0, start) +
      marker +
      value.slice(start, end) +
      marker +
      value.slice(end)
    applyChange(nextValue, start + markerLen, end + markerLen)
    return
  }
  const before = value.slice(start - markerLen, start)
  const after = value.slice(start, start + markerLen)
  if (before === marker && after === marker) {
    const nextValue =
      value.slice(0, start - markerLen) + value.slice(start + markerLen)
    applyChange(nextValue, start - markerLen)
    return
  }
  const nextValue = value.slice(0, start) + marker + marker + value.slice(start)
  applyChange(nextValue, start + markerLen)
}

export function handleUnderline(
  value: string,
  start: number,
  end: number,
  applyChange: (nextValue: string, nextStart: number, nextEnd?: number) => void,
) {
  const marker = "__"
  const markerLen = marker.length
  if (start !== end) {
    const before = value.slice(start - markerLen, start)
    const after = value.slice(end, end + markerLen)
    if (before === marker && after === marker) {
      const nextValue =
        value.slice(0, start - markerLen) +
        value.slice(start, end) +
        value.slice(end + markerLen)
      applyChange(nextValue, start - markerLen, end - markerLen)
      return
    }
    const nextValue =
      value.slice(0, start) +
      marker +
      value.slice(start, end) +
      marker +
      value.slice(end)
    applyChange(nextValue, start + markerLen, end + markerLen)
    return
  }
  const before = value.slice(start - markerLen, start)
  const after = value.slice(start, start + markerLen)
  if (before === marker && after === marker) {
    const nextValue =
      value.slice(0, start - markerLen) + value.slice(start + markerLen)
    applyChange(nextValue, start - markerLen)
    return
  }
  const nextValue = value.slice(0, start) + marker + marker + value.slice(start)
  applyChange(nextValue, start + markerLen)
}

export function handleLink(
  value: string,
  start: number,
  end: number,
  emitChange: (nextValue: string) => void,
  setSelection: (start: number, end?: number) => void,
) {
  const hasSelection = start !== end
  const selected = value.slice(start, end)
  const label = hasSelection ? selected : ""
  const insertion = hasSelection ? `[${label}](url)` : "[](url)"
  const nextValue = value.slice(0, start) + insertion + value.slice(end)
  emitChange(nextValue)
  const cursorStart = hasSelection ? start + label.length + 3 : start + 3
  const cursorEnd = cursorStart + 3
  setSelection(cursorStart, cursorEnd)
}

export function handleTab(
  value: string,
  start: number,
  end: number,
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  emitChange: (nextValue: string) => void,
  setSelection: (start: number, end?: number) => void,
) {
  const lineStart = getLineStart(value, start)
  const lineEnd = getLineEnd(value, start)
  const line = value.slice(lineStart, lineEnd)
  const listLine = isListLine(line) || isOrderedLine(line)
  if (listLine) {
    e.preventDefault()
    const leading = line.match(/^\s*/)?.[0] ?? ""
    if (e.shiftKey) {
      const removeCount = Math.min(INDENT_SIZE, leading.length)
      if (removeCount > 0) {
        const nextValue =
          value.slice(0, lineStart) +
          leading.slice(removeCount) +
          line.slice(leading.length) +
          value.slice(lineEnd)
        emitChange(nextValue)
        setSelection(start - removeCount)
      }
      return
    }
    const indent = " ".repeat(INDENT_SIZE)
    const nextValue =
      value.slice(0, lineStart) + indent + value.slice(lineStart)
    emitChange(nextValue)
    setSelection(start + INDENT_SIZE)
    return
  }
  if (!e.shiftKey) {
    e.preventDefault()
    const indent = " ".repeat(INDENT_SIZE)
    const nextValue = value.slice(0, start) + indent + value.slice(end)
    emitChange(nextValue)
    setSelection(start + INDENT_SIZE)
    return
  }
}

export function handleBacklink(
  value: string,
  start: number,
  onBacklinkRequest?: (range: { start: number; end: number }) => void,
  e?: React.KeyboardEvent<HTMLTextAreaElement>,
) {
  const prevChar = value[start - 1]
  if (prevChar === "[" && onBacklinkRequest) {
    e?.preventDefault()
    onBacklinkRequest({ start: start - 1, end: start })
  }
}

export function handleEnter(
  value: string,
  start: number,
  end: number,
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  emitChange: (nextValue: string) => void,
  setSelection: (start: number, end?: number) => void,
) {
  const lineStart = getLineStart(value, start)
  const line = value.slice(lineStart, start)
  const unordered = line.match(/^(\s*)([-*])\s+(.*)$/)
  const ordered = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
  if (unordered || ordered) {
    const indent = (unordered ?? ordered)?.[1] ?? ""
    const marker = unordered?.[2]
    const number = ordered ? Number(ordered[2]) : null
    const content = (unordered ?? ordered)?.[3] ?? ""
    e.preventDefault()
    if (content.trim().length === 0) {
      const lineEnd = value.indexOf("\n", start)
      const endIndex = lineEnd === -1 ? value.length : lineEnd
      const nextValue =
        value.slice(0, lineStart) + indent + value.slice(endIndex)
      emitChange(nextValue)
      setSelection(lineStart + indent.length)
      return
    }
    const nextMarker = marker ?? (number === null ? "1" : String(number + 1))
    const insertion = marker
      ? `\n${indent}${marker} `
      : `\n${indent}${nextMarker}. `
    const nextValue = value.slice(0, start) + insertion + value.slice(end)
    emitChange(nextValue)
    setSelection(start + insertion.length)
    return
  }
}

export function handlePairChar(
  value: string,
  start: number,
  end: number,
  ch: string,
  emitChange: (nextValue: string) => void,
  setSelection: (start: number, end?: number) => void,
) {
  const lineStart = getLineStart(value, start)
  const linePrefix = value.slice(lineStart, start)
  const isLineStart = /^\s*$/.test(linePrefix)
  if (ch === "*" && isLineStart) return
  if (start !== end) {
    const selected = value.slice(start, end)
    const nextValue =
      value.slice(0, start) + ch + selected + ch + value.slice(end)
    emitChange(nextValue)
    setSelection(start + 1, end + 1)
    return
  }
  const prevChar = value[start - 1]
  const nextChar = value[start]
  const prevPrev = value[start - 2]
  const nextNext = value[start + 1]
  if (nextChar === ch && prevChar !== ch) {
    setSelection(start + 1)
    return
  }
  if (prevChar === ch && nextChar === ch) {
    if (prevPrev !== ch && nextNext !== ch) {
      const nextValue = value.slice(0, start) + ch + ch + value.slice(start)
      emitChange(nextValue)
      setSelection(start + 1)
      return
    }
    setSelection(start + 1)
    return
  }
  const nextValue = value.slice(0, start) + ch + ch + value.slice(end)
  emitChange(nextValue)
  setSelection(start + 1)
}

export function handleDeletePair(
  value: string,
  start: number,
  end: number,
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  emitChange: (nextValue: string) => void,
  setSelection: (start: number, end?: number) => void,
) {
  const isBackspace = e.key === "Backspace"
  const leftIndex = isBackspace ? start - 1 : start
  const rightIndex = isBackspace ? start : start + 1
  const leftChar = value[leftIndex]
  const rightChar = value[rightIndex]
  if (isBackspace) {
    const lineStart = getLineStart(value, start)
    const before = value.slice(lineStart, start)
    const match = before.match(/^(\s*)([-*]|\d+\.)\s+$/)
    if (match) {
      e.preventDefault()
      const nextValue = value.slice(0, lineStart) + value.slice(start)
      emitChange(nextValue)
      setSelection(lineStart)
      return
    }
  }
  if (leftChar && rightChar && leftChar === rightChar) {
    const leftRun = countRun(value, leftIndex, -1, leftChar)
    const rightRun = countRun(value, rightIndex, 1, rightChar)
    if (leftRun === rightRun && PAIR_CHARS.has(leftChar)) {
      e.preventDefault()
      const leftStart = leftIndex - leftRun + 1
      const rightEnd = rightIndex + rightRun - 1
      const nextValue = value.slice(0, leftStart) + value.slice(rightEnd + 1)
      emitChange(nextValue)
      setSelection(leftStart)
      return
    }
  }
}

export const RichTextarea = forwardRef<HTMLTextAreaElement, RichTextareaProps>(
  ({ onKeyDown, onChange, onBacklinkRequest, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null)

    const setRefs = useCallback(
      (element: HTMLTextAreaElement | null) => {
        internalRef.current = element
        if (typeof ref === "function") {
          ref(element)
        } else if (ref) {
          ref.current = element
        }
      },
      [ref],
    )

    const emitChange = useCallback(
      (nextValue: string) => {
        const el = internalRef.current
        if (el) {
          el.value = nextValue
        }
        if (onChange) {
          const event = {
            target: { value: nextValue },
            currentTarget: { value: nextValue },
          } as React.ChangeEvent<HTMLTextAreaElement>
          onChange(event)
        }
      },
      [onChange],
    )

    const setSelection = useCallback((start: number, end = start) => {
      const el = internalRef.current
      if (!el) return
      requestAnimationFrame(() => {
        el.setSelectionRange(start, end)
      })
    }, [])

    const applyChange = useCallback(
      (nextValue: string, nextStart: number, nextEnd = nextStart) => {
        emitChange(nextValue)
        setSelection(nextStart, nextEnd)
      },
      [emitChange, setSelection],
    )

    const toggleWrap = useCallback(
      (marker: string, start: number, end: number) => {
        const el = internalRef.current
        if (!el) return
        const value = el.value
        const markerLen = marker.length

        if (start !== end) {
          const before = value.slice(start - markerLen, start)
          const after = value.slice(end, end + markerLen)
          if (before === marker && after === marker) {
            const nextValue =
              value.slice(0, start - markerLen) +
              value.slice(start, end) +
              value.slice(end + markerLen)
            applyChange(nextValue, start - markerLen, end - markerLen)
            return
          }
          const nextValue =
            value.slice(0, start) +
            marker +
            value.slice(start, end) +
            marker +
            value.slice(end)
          applyChange(nextValue, start + markerLen, end + markerLen)
          return
        }

        const before = value.slice(start - markerLen, start)
        const after = value.slice(start, start + markerLen)
        if (before === marker && after === marker) {
          const nextValue =
            value.slice(0, start - markerLen) + value.slice(start + markerLen)
          applyChange(nextValue, start - markerLen)
          return
        }

        const nextValue =
          value.slice(0, start) + marker + marker + value.slice(start)
        applyChange(nextValue, start + markerLen)
      },
      [applyChange],
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || e.nativeEvent.isComposing) return

        const el = e.currentTarget
        const value = el.value
        const start = el.selectionStart ?? 0
        const end = el.selectionEnd ?? 0

        if ((e.metaKey || e.ctrlKey) && !e.altKey) {
          const key = e.key.toLowerCase()
          if (key === "b") {
            e.preventDefault()
            handleBold(value, start, end, applyChange)
            return
          }
          if (key === "i") {
            e.preventDefault()
            handleItalic(value, start, end, applyChange)
            return
          }
          if (key === "u") {
            e.preventDefault()
            handleUnderline(value, start, end, applyChange)
            return
          }
          if (key === "k") {
            e.preventDefault()
            handleLink(value, start, end, emitChange, setSelection)
            return
          }
        }

        if (e.metaKey || e.ctrlKey || e.altKey) return

        if (e.key === "Tab" && start === end) {
          handleTab(value, start, end, e, emitChange, setSelection)
          return
        }

        if (e.key === "[" && start === end && onBacklinkRequest) {
          handleBacklink(value, start, onBacklinkRequest, e)
          return
        }

        if (e.key === "Enter" && start === end) {
          handleEnter(value, start, end, e, emitChange, setSelection)
          return
        }

        if (PAIR_CHARS.has(e.key)) {
          handlePairChar(value, start, end, e.key, emitChange, setSelection)
          return
        }

        if ((e.key === "Backspace" || e.key === "Delete") && start === end) {
          handleDeletePair(value, start, end, e, emitChange, setSelection)
          return
        }
      },
      [emitChange, setSelection, applyChange, onBacklinkRequest, onKeyDown],
    )

    const { disableShortcuts, enableShortcuts } = useSettings()
    const [preview, setPreview] = useState(false)

    const [previewHeight, setPreviewHeight] = useState<number | null>(null)

    const withSelection = useCallback(
      (fn: (value: string, start: number, end: number) => void) => {
        const el = internalRef.current
        if (!el) return
        el.focus()
        const start = el.selectionStart ?? 0
        const end = el.selectionEnd ?? 0
        fn(el.value, start, end)
      },
      [],
    )

    const toggleLinePrefix = useCallback(
      (
        value: string,
        start: number,
        end: number,
        prefix: string,
        matcher: RegExp,
      ) => {
        const lineStart = getLineStart(value, start)
        const lineEnd = getLineEnd(value, start)
        const line = value.slice(lineStart, lineEnd)
        const indent = line.match(/^\s*/)?.[0] ?? ""
        const contentStart = lineStart + indent.length
        const content = line.slice(indent.length)
        const hasPrefix = matcher.test(content)

        if (hasPrefix) {
          const removeLen = content.match(matcher)?.[0].length ?? 0
          const nextValue =
            value.slice(0, contentStart) +
            content.slice(removeLen) +
            value.slice(lineEnd)
          applyChange(
            nextValue,
            Math.max(0, start - removeLen),
            Math.max(0, end - removeLen),
          )
          return
        }

        const nextValue =
          value.slice(0, contentStart) + prefix + value.slice(contentStart)
        const delta = prefix.length
        applyChange(nextValue, start + delta, end + delta)
      },
      [applyChange],
    )

    const syncHeight = useCallback(() => {
      const el = internalRef.current
      if (!el) return
      setPreviewHeight(el.scrollHeight)
    }, [])

    useEffect(() => {
      if (!preview) syncHeight()
    }, [props.value, preview, syncHeight])

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-2 py-1 shadow-sm">
          <Tooltip content="Bold (Cmd/Ctrl + B)" delay={500}>
            <Button
              variant="ghost"
              className="px-2 py-1"
              disabled={preview}
              aria-label="Bold"
              onClick={() =>
                withSelection((value, start, end) =>
                  handleBold(value, start, end, applyChange),
                )
              }
            >
              <Bold size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="Italic (Cmd/Ctrl + I)" delay={500}>
            <Button
              variant="ghost"
              className="px-2 py-1"
              disabled={preview}
              aria-label="Italic"
              onClick={() =>
                withSelection((value, start, end) =>
                  handleItalic(value, start, end, applyChange),
                )
              }
            >
              <Italic size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="Underline (Cmd/Ctrl + U)" delay={500}>
            <Button
              variant="ghost"
              className="px-2 py-1"
              disabled={preview}
              aria-label="Underline"
              onClick={() =>
                withSelection((value, start, end) =>
                  handleUnderline(value, start, end, applyChange),
                )
              }
            >
              <Underline size={16} />
            </Button>
          </Tooltip>
          <span className="h-5 w-px bg-[rgb(var(--border))]" aria-hidden />
          <Tooltip content="Link (Cmd/Ctrl + K)" delay={500}>
            <Button
              variant="ghost"
              className="px-2 py-1"
              disabled={preview}
              aria-label="Link"
              onClick={() =>
                withSelection((value, start, end) =>
                  handleLink(value, start, end, emitChange, setSelection),
                )
              }
            >
              <Link2 size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="Inline code" delay={500}>
            <Button
              variant="ghost"
              className="px-2 py-1"
              disabled={preview}
              aria-label="Inline code"
              onClick={() =>
                withSelection((_, start, end) => toggleWrap("`", start, end))
              }
            >
              <Code2 size={16} />
            </Button>
          </Tooltip>
          <span className="h-5 w-px bg-[rgb(var(--border))]" aria-hidden />
          <Tooltip content="Bullet list" delay={500}>
            <Button
              variant="ghost"
              className="px-2 py-1"
              disabled={preview}
              aria-label="Bullet list"
              onClick={() =>
                withSelection((value, start, end) =>
                  toggleLinePrefix(value, start, end, "- ", /^[-*]\s+/),
                )
              }
            >
              <List size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="Numbered list" delay={500}>
            <Button
              variant="ghost"
              className="px-2 py-1"
              disabled={preview}
              aria-label="Numbered list"
              onClick={() =>
                withSelection((value, start, end) =>
                  toggleLinePrefix(value, start, end, "1. ", /^\d+\.\s+/),
                )
              }
            >
              <ListOrdered size={16} />
            </Button>
          </Tooltip>
          <Tooltip content="Blockquote" delay={500}>
            <Button
              variant="ghost"
              className="px-2 py-1"
              disabled={preview}
              aria-label="Quote"
              onClick={() =>
                withSelection((value, start, end) =>
                  toggleLinePrefix(value, start, end, "> ", /^>\s+/),
                )
              }
            >
              <Quote size={16} />
            </Button>
          </Tooltip>
          <span className="h-5 w-px bg-[rgb(var(--border))]" aria-hidden />
          <Tooltip content="Toggle preview" delay={500}>
            <Button
              variant="ghost"
              className="px-2 py-1"
              onClick={() => setPreview((prev) => !prev)}
              aria-label="Toggle preview"
            >
              {preview ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </Tooltip>
        </div>

        {preview ? (
          <div
            className="text-[rgb(var(--foreground))] bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg p-2 break-words overflow-y-auto max-h-64 text-base"
            style={{ height: previewHeight ?? undefined }}
          >
            <RenderedMarkdown value={props.value as string} isPreview />
          </div>
        ) : (
          <Textarea
            {...props}
            ref={setRefs}
            onFocus={disableShortcuts}
            onBlur={enableShortcuts}
            onKeyDown={handleKeyDown}
            animation={false}
            onChange={(e) => {
              onChange?.(e)
            }}
          />
        )}
      </div>
    )
  },
)

RichTextarea.displayName = "RichTextarea"
