"use client"

import Modal from "./Modal"
import { Command } from "lucide-react"
import { useSettings } from "@/context/SettingsContext"

export default function ShortcutsModal() {
  const { settings } = useSettings()

  return (
    <Modal name="shortcuts">
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Shortcuts</h1>
      <div className="w-full sm:w-80 md:w-120">
        <table className="w-full table-auto border-collapse text-sm sm:text-base">
          <thead>
            <tr>
              <th className="text-left border-b pb-2">Action</th>
              <th className="text-left border-b pb-2">Shortcut</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(settings.shortcuts).map((shortcut) => (
              <tr key={shortcut.designation}>
                <td className="py-2 pr-2 sm:pr-4 align-top">
                  {shortcut.designation}
                </td>
                <td className="py-2">
                  <div className="flex gap-1 flex-wrap">
                    {shortcut.keys.map((key, index) => (
                      <span
                        key={index}
                        className="px-1.5 sm:px-2 py-0.5 sm:py-1 border border-[rgb(var(--muted))] rounded bg-[rgb(var(--muted-background))] text-[rgb(var(--muted))] text-xs sm:text-sm flex items-center justify-center"
                      >
                        {key === "Meta" ? (
                          <Command size={14} aria-label="Control" />
                        ) : (
                          key
                        )}
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
