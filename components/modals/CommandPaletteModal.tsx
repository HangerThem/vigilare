"use client"

import Modal from "@/components/modals/Modal"
import Fuse from "fuse.js"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/Input"
import { useModal } from "@/context/ModalContext"
import { useTheme } from "@/context/ThemeContext"
import {
  ClipboardCopy,
  Download,
  FileDown,
  FileUp,
  Import,
  Link,
  Network,
  Notebook,
  PaintRoller,
  Search,
  Settings,
  Share,
  SquareSlash,
  Terminal,
} from "lucide-react"
import { downloadAppData, exportState, importAppData } from "@/utils/appData"
import { useSettings } from "@/context/SettingsContext"

interface CommandBase {
  icon?: React.ReactNode
  name: string
}

interface CommandWithAction extends CommandBase {
  type: "action"
  action: () => void
}

export type CommandWithCommands = CommandBase & {
  type: "commands"
  commands: CommandWithAction[]
}

type Command = CommandWithAction | CommandWithCommands

export default function CommandPaletteModal() {
  const { isModalOpen, closeModal } = useModal()
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { setTheme, getIcon, themeOptions } = useTheme()
  const { openModal } = useModal()

  const isOpen = isModalOpen("commandPalette")
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])

  const generateCommands = useCallback(() => {
    const commands: Command[] = [
      {
        type: "action",
        icon: <Link size={16} />,
        name: "New Link",
        action: () => {
          openModal("links")
        },
      },
      {
        type: "action",
        icon: <Notebook size={16} />,
        name: "New Note",
        action: () => {
          openModal("notes")
        },
      },
      {
        type: "action",
        icon: <Terminal size={16} />,
        name: "New Command",
        action: () => {
          openModal("commands")
        },
      },
      {
        type: "action",
        icon: <Network size={16} />,
        name: "New Status",
        action: () => {
          openModal("status")
        },
      },
      {
        type: "action",
        icon: <Settings size={16} />,
        name: "Open Settings",
        action: () => {
          openModal("settings")
        },
      },
      {
        type: "action",
        icon: <Search size={16} />,
        name: "Global Search",
        action: () => {
          openModal("globalSearch")
        },
      },
      {
        type: "action",
        icon: <SquareSlash size={16} />,
        name: "Shortcuts",
        action: () => {
          openModal("shortcuts")
        },
      },
      {
        type: "commands",
        icon: <Import size={16} />,
        name: "Import Data",
        commands: [
          {
            type: "action",
            icon: <FileUp size={16} />,
            name: "Import from JSON",
            action: () => {
              importAppData()
            },
          },
          {
            type: "action",
            icon: <ClipboardCopy size={16} />,
            name: "Import from Text",
            action: () => {
              openModal("importFromText")
            },
          },
        ],
      },
      {
        type: "commands",
        icon: <Download size={16} />,
        name: "Export Data",
        commands: [
          {
            type: "action",
            icon: <FileDown size={16} />,
            name: "Export as JSON",
            action: () => {
              downloadAppData()
            },
          },
          {
            type: "action",
            icon: <ClipboardCopy size={16} />,
            name: "Copy to Clipboard",
            action: () => {
              navigator.clipboard
                .writeText(exportState(localStorage))
                .catch((err) => {
                  console.error("Failed to copy data to clipboard", err)
                })
            },
          },
        ],
      },
      {
        type: "commands",
        icon: <PaintRoller size={16} />,
        name: "Change Theme",
        commands: Array.from(themeOptions).map((themeOption) => ({
          type: "action",
          icon: getIcon(themeOption),
          name: themeOption.charAt(0).toUpperCase() + themeOption.slice(1),
          action: () => {
            setTheme(themeOption)
          },
        })),
      },
      {
        type: "action",
        icon: <Share size={16} />,
        name: "Share Dashboard",
        action: () => {
          openModal("shareDashboard")
        },
      },
    ]

    return commands
  }, [openModal, getIcon, setTheme, themeOptions])

  const [commandsState, setCommandsState] =
    useState<Command[]>(generateCommands())

  const { settings } = useSettings()

  const results = useMemo(() => {
    if (query === "") {
      return commandsState
    }

    const fuse = new Fuse(commandsState, {
      keys: ["name"],
      threshold: settings.fuzzySearchThreshold,
    })

    return fuse.search(query).map((result) => result.item)
  }, [query, commandsState, settings.fuzzySearchThreshold])

  const clampedSelectedIndex = useMemo(() => {
    return Math.min(selectedIndex, Math.max(0, results.length - 1))
  }, [selectedIndex, results.length])

  const handleClose = useCallback(() => {
    setCommandsState(generateCommands())
    setQuery("")
    setSelectedIndex(0)
  }, [generateCommands])

  const handleCommandActionSelect = useCallback(
    (command: { name: string; action: () => void }) => {
      closeModal()
      command.action()
    },
    [closeModal],
  )

  const handleCommandsUpdate = useCallback((newCommands: Command[]) => {
    setCommandsState(newCommands)
    setQuery("")
  }, [])

  useEffect(() => {
    if (itemRefs.current[clampedSelectedIndex]) {
      itemRefs.current[clampedSelectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      })
    }
  }, [clampedSelectedIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev,
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === "Enter") {
        e.preventDefault()
        const command = results[clampedSelectedIndex]
        if (command) {
          if (command.type === "commands") {
            handleCommandsUpdate(command.commands)
            setSelectedIndex(0)
          } else {
            handleCommandActionSelect(command)
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        closeModal()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    clampedSelectedIndex,
    results,
    isOpen,
    closeModal,
    handleCommandActionSelect,
    handleCommandsUpdate,
  ])

  return (
    <Modal name="commandPalette" onClose={handleClose}>
      <div className="w-full sm:w-80 md:w-96">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="mb-3 sm:mb-4"
          autoFocus
        />
        <ul className="max-h-48 sm:max-h-56 md:max-h-64 overflow-y-auto pr-2 sm:pr-3">
          {results.map((command, index) => (
            <li
              key={command.name}
              ref={(el) => {
                itemRefs.current[index] = el
              }}
              onClick={() =>
                command.type === "commands"
                  ? handleCommandsUpdate(command.commands)
                  : handleCommandActionSelect(command)
              }
              onMouseEnter={() => setSelectedIndex(index)}
              className={`p-2 flex items-center gap-2 cursor-pointer rounded transition-colors ${clampedSelectedIndex === index ? "bg-[rgb(var(--card-hover))]" : ""}`}
            >
              {command.icon && <span aria-hidden="true">{command.icon}</span>}
              {command.name}
            </li>
          ))}
          {results.length === 0 && (
            <li className="p-2 text-[rgb(var(--muted))]">No commands found.</li>
          )}
        </ul>
      </div>
    </Modal>
  )
}
