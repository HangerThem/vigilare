"use client"

import { forwardRef, useCallback, useRef } from "react"
import type React from "react"
import { Textarea } from "@/components/ui/Textarea"
import { useSettings } from "@/context/SettingsContext"

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

    const { disableShortcuts, enableShortcuts } = useSettings()

    return (
      <Textarea
        {...props}
        ref={setRefs}
        onFocus={disableShortcuts}
        onBlur={enableShortcuts}
        onKeyDown={(e) => {
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
              toggleWrap("**", start, end)
              return
            }
            if (key === "i") {
              e.preventDefault()
              toggleWrap("*", start, end)
              return
            }
            if (key === "u") {
              e.preventDefault()
              toggleWrap("__", start, end)
              return
            }
            if (key === "k") {
              e.preventDefault()
              const hasSelection = start !== end
              const selected = value.slice(start, end)
              const label = hasSelection ? selected : ""
              const insertion = hasSelection
                ? `[${label}](url)`
                : "[](url)"
              const nextValue =
                value.slice(0, start) + insertion + value.slice(end)
              emitChange(nextValue)
              const cursorStart = hasSelection
                ? start + label.length + 3
                : start + 3
              const cursorEnd = cursorStart + 3
              setSelection(cursorStart, cursorEnd)
              return
            }
          }

          if (e.metaKey || e.ctrlKey || e.altKey) return

          if (e.key === "Tab" && start === end) {
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
                value.slice(0, lineStart) +
                indent +
                value.slice(lineStart)
              emitChange(nextValue)
              setSelection(start + INDENT_SIZE)
              return
            }

            if (!e.shiftKey) {
              e.preventDefault()
              const indent = " ".repeat(INDENT_SIZE)
              const nextValue =
                value.slice(0, start) + indent + value.slice(end)
              emitChange(nextValue)
              setSelection(start + INDENT_SIZE)
              return
            }
          }

          if (e.key === "[" && start === end && onBacklinkRequest) {
            const prevChar = value[start - 1]
            if (prevChar === "[") {
              e.preventDefault()
              onBacklinkRequest({ start: start - 1, end: start })
              return
            }
          }

          if (e.key === "Enter" && start === end) {
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

              const nextMarker =
                marker ?? (number === null ? "1" : String(number + 1))
              const insertion = marker
                ? `\n${indent}${marker} `
                : `\n${indent}${nextMarker}. `
              const nextValue =
                value.slice(0, start) + insertion + value.slice(end)
              emitChange(nextValue)
              setSelection(start + insertion.length)
              return
            }
          }

          if (PAIR_CHARS.has(e.key)) {
            const lineStart = getLineStart(value, start)
            const linePrefix = value.slice(lineStart, start)
            const isLineStart = /^\s*$/.test(linePrefix)

            if (e.key === "*" && isLineStart) {
              return
            }

            const ch = e.key
            e.preventDefault()

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
                const nextValue =
                  value.slice(0, start) + ch + ch + value.slice(start)
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
            return
          }

          if ((e.key === "Backspace" || e.key === "Delete") && start === end) {
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
                const nextValue =
                  value.slice(0, lineStart) + value.slice(start)
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
                const nextValue =
                  value.slice(0, leftStart) + value.slice(rightEnd + 1)
                emitChange(nextValue)
                setSelection(leftStart)
                return
              }
            }
          }
        }}
        onChange={(e) => {
          onChange?.(e)
        }}
      />
    )
  },
)

RichTextarea.displayName = "RichTextarea"
