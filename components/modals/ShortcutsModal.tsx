"use client"

import { useEffect, useState } from "react"
import Modal from "./Modal"
import { Command } from "lucide-react"
import { ModalName } from "@/context/ModalContext"

interface Shortcut {
  keys: string[]
  designation: string
  modalName: ModalName
}

export const shortcuts: Shortcut[] = [
  {
    keys: ["Ctrl", "K"],
    designation: "Open Command Palette",
    modalName: "commandPalette",
  },
  {
    keys: ["Ctrl", "P"],
    designation: "Open Global Search",
    modalName: "globalSearch",
  },
  {
    keys: ["Ctrl", "I"],
    designation: "Open Shortcuts",
    modalName: "shortcuts",
  },
  {
    keys: ["Ctrl", "L"],
    designation: "New Link",
    modalName: "links",
  },
  {
    keys: ["Ctrl", "Shift", "N"],
    designation: "New Note",
    modalName: "notes",
  },
  {
    keys: ["Ctrl", "Shift", "C"],
    designation: "New Command",
    modalName: "commands",
  },
  {
    keys: ["Ctrl", "S"],
    designation: "New Status",
    modalName: "status",
  },
]

export default function ShortcutsModal() {
  const [metaKey, setMetaKey] = useState<React.ReactNode>("Ctrl")

  useEffect(() => {
    queueMicrotask(() => {
      setMetaKey(
        navigator.userAgent.includes("Macintosh") ? (
          <Command size={14} />
        ) : (
          "Ctrl"
        ),
      )
    })
  }, [])

  return (
    <Modal name="shortcuts">
      <h1 className="text-2xl font-bold mb-4">Shortcuts</h1>
      <div className="w-120">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b pb-2">Action</th>
              <th className="text-left border-b pb-2">Shortcut</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map((shortcut) => (
              <tr key={shortcut.designation}>
                <td className="py-2 pr-4 align-top">{shortcut.designation}</td>
                <td className="py-2">
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 border border-[rgb(var(--muted))]  rounded bg-[rgb(var(--muted-background))] text-[rgb(var(--muted))] text-sm flex items-center justify-center"
                      >
                        {key === "Ctrl" ? metaKey : key}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
