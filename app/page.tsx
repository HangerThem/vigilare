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
import ShortcutsModal from "@/components/modals/ShortcutsModal"
import SettingsModal from "@/components/modals/SettingsModal"
import ConfirmModal from "@/components/modals/ConfirmDialogModal"
import { useSettings } from "@/context/SettingsContext"

export default function Home() {
  const { openModal, isModalOpen, closeModal } = useModal()
  const { settings, isEditingShortcut } = useSettings()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingShortcut) return

      const shortcut = Object.values(settings.shortcuts).find(
        (s) =>
          s.keys.every(
            (key) =>
              e.key.toUpperCase() === key.toUpperCase() ||
              (key === "Shift" && e.shiftKey) ||
              (key === "Ctrl" && e.ctrlKey) ||
              (key === "Meta" && e.metaKey),
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
  }, [
    openModal,
    closeModal,
    isModalOpen,
    settings.shortcuts,
    isEditingShortcut,
  ])

  return (
    <div
      className={`relative ${settings.compactMode ? "gap-1" : "gap-2"} min-h-screen md:max-h-screen flex flex-col ${settings.compactMode ? "p-2 sm:p-3 md:p-4" : "p-3 sm:p-4 md:p-6"} bg-[rgb(var(--background))]`}
    >
      <CommandPaletteModal />
      <GlobalSearchModal />
      <ShortcutsModal />
      <SettingsModal />
      <ConfirmModal />
      <Header />
      <main
        className={`grid grid-cols-1 md:grid-cols-2 ${settings.compactMode ? "gap-1" : "gap-2"} flex-1 md:grid-rows-2 min-h-0 overflow-auto md:overflow-hidden pb-4 md:pb-0`}
      >
        <LinksPanel />
        <NotesPanel />
        <CommandsPanel />
        <StatusPanel />
      </main>
    </div>
  )
}
