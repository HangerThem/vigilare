"use client"

import { CommandsPanel } from "@/components/panels/CommandsPanel"
import { Header } from "@/components/Header"
import { LinksPanel } from "@/components/panels/LinksPanel"
import { NotesPanel } from "@/components/panels/NotesPanel"
import { StatusPanel } from "@/components/panels/StatusPanel"
import { useEffect } from "react"
import CommandPaletteModal from "@/components/modals/CommandPaletteModal"
import { useModal } from "@/context/ModalContext"
import GlobalSearchModal from "@/components/modals/GlobalSearchModal"
import ShortcutsModal, { shortcuts } from "@/components/modals/ShortcutsModal"

export default function Home() {
  const { openModal, isModalOpen, closeModal } = useModal()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = shortcuts.find(
        (s) =>
          s.keys.every(
            (key) =>
              e.key.toUpperCase() === key.toUpperCase() ||
              (key === "Shift" && e.shiftKey) ||
              (key === "Ctrl" && (e.ctrlKey || e.metaKey)),
          ) &&
          s.keys.length ===
            (e.ctrlKey || e.metaKey ? 1 : 0) + (e.shiftKey ? 1 : 0) + 1,
      )
      if (shortcut) {
        e.preventDefault()
        if (isModalOpen(shortcut.modalName)) {
          closeModal()
        } else {
          openModal(shortcut.modalName)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [openModal, closeModal, isModalOpen])

  return (
    <div className="relative gap-2 min-h-screen md:max-h-screen flex flex-col p-6 bg-[rgb(var(--background))]">
      <CommandPaletteModal />
      <GlobalSearchModal />
      <ShortcutsModal />
      <Header />
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-2 flex-1 grid-rows-2 min-h-0">
        <LinksPanel />
        <NotesPanel />
        <CommandsPanel />
        <StatusPanel />
      </main>
    </div>
  )
}
