"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  useFloating,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
} from "@floating-ui/react"
import Fuse from "fuse.js"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/utils/cn"
import { Input } from "@/components/ui/Input"
import { useSettings } from "@/context/SettingsContext"

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  description?: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string | number | null
  onChange?: (value: string | number | null) => void
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  clearable?: boolean
  className?: string
  maxHeight?: number
  noOptionsMessage?: string
}

export function Select({
  options,
  value = null,
  onChange,
  placeholder = "Select...",
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search...",
  clearable = false,
  className = "",
  maxHeight = 256,
  noOptionsMessage = "No options found",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const { settings } = useSettings()

  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-start",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ fallbackPlacements: ["top-start"] }),
      shift({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          elements.floating.style.width = `${rects.reference.width}px`
        },
      }),
    ],
  })

  const fuse = useMemo(
    () =>
      new Fuse(options, {
        keys: ["label", "description"],
        threshold: settings.fuzzySearchThreshold,
      }),
    [options, settings.fuzzySearchThreshold],
  )

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options
    return fuse.search(searchQuery).map((result) => result.item)
  }, [options, searchQuery, fuse])

  const selectableOptions = useMemo(
    () => filteredOptions.filter((opt) => !opt.disabled),
    [filteredOptions],
  )

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value],
  )

  const handleSelect = useCallback(
    (option: SelectOption) => {
      if (option.disabled) return
      onChange?.(option.value)
      setIsOpen(false)
      setSearchQuery("")
    },
    [onChange],
  )

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange?.(null)
      setSearchQuery("")
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return

      switch (e.key) {
        case "Enter":
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else if (
            highlightedIndex >= 0 &&
            highlightedIndex < selectableOptions.length
          ) {
            handleSelect(selectableOptions[highlightedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          setIsOpen(false)
          setSearchQuery("")
          break
        case "ArrowDown":
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else {
            setHighlightedIndex((prev) =>
              prev < selectableOptions.length - 1 ? prev + 1 : 0,
            )
          }
          break
        case "ArrowUp":
          e.preventDefault()
          if (isOpen) {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : selectableOptions.length - 1,
            )
          }
          break
      }
    },
    [disabled, isOpen, highlightedIndex, selectableOptions, handleSelect],
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
      setHighlightedIndex(-1)
    },
    [],
  )

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[
        highlightedIndex
      ] as HTMLElement
      highlightedElement?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightedIndex])

  const dropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={(node) => {
            dropdownRef.current = node
            refs.setFloating(node)
          }}
          className="z-50 bg-[rgb(var(--background))] rounded-lg border border-[rgb(var(--border))] shadow-lg overflow-hidden pointer-events-auto"
          style={floatingStyles}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12 }}
        >
          {searchable && (
            <div className="flex gap-2 items-center p-2 border-b border-[rgb(var(--border))]">
              <Search size={16} className="text-[rgb(var(--muted))]" />
              <Input
                ref={searchInputRef}
                type="text"
                variant="ghost"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
              />
            </div>
          )}

          <div
            ref={listRef}
            className="overflow-y-auto"
            style={{ maxHeight }}
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-8 text-center text-[rgb(var(--muted))] text-sm">
                {noOptionsMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value
                const isHighlighted = index === highlightedIndex

                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      flex items-center justify-between px-3 py-2 cursor-pointer transition-colors
                      ${isHighlighted ? "bg-[rgb(var(--card-hover))]" : ""}
                      ${isSelected ? "bg-[rgb(var(--card-hover))]" : ""}
                      ${option.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[rgb(var(--card-hover))]"}
                    `}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {option.icon && (
                        <span className="w-4 h-4 shrink-0">{option.icon}</span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-[rgb(var(--foreground))] truncate">
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="text-xs text-[rgb(var(--muted))] truncate">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-[rgb(var(--primary))]" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const canUseDOM = typeof document !== "undefined"

  return (
    <div className={cn("relative w-full", className)} onKeyDown={handleKeyDown}>
      <motion.div
        ref={(node) => {
          triggerRef.current = node
          refs.setReference(node)
        }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between min-h-[42px] px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] transition-colors duration-200 cursor-pointer",
          isOpen
            ? "border-[rgb(var(--primary))]"
            : disabled
              ? "opacity-50 cursor-not-allowed bg-[rgb(var(--card-hover))]"
              : "hover:border-[rgb(var(--border-hover))]",
        )}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex-1 min-w-0 mr-2">
          {selectedOption ? (
            <span className="flex items-center gap-2 text-[rgb(var(--foreground))]">
              {selectedOption.icon && (
                <span className="w-4 h-4">{selectedOption.icon}</span>
              )}
              {selectedOption.label}
            </span>
          ) : (
            <span className="text-[rgb(var(--muted))]">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && !disabled && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClear}
              className="p-1 rounded hover:bg-[rgb(var(--card-hover))] text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] cursor-pointer"
            >
              <X size={16} />
            </motion.button>
          )}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4 text-[rgb(var(--muted))]"
          >
            <ChevronDown size={16} />
          </motion.span>
        </div>
      </motion.div>

      {canUseDOM && createPortal(dropdown, document.body)}
    </div>
  )
}
