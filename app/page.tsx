"use client"

import { SnippetsPanel } from "@/components/panels/SnippetsPanel"
import { Header } from "@/components/layout/Header"
import { LinksPanel } from "@/components/panels/LinksPanel"
import { NotesPanel } from "@/components/panels/NotesPanel"
import { StatusPanel } from "@/components/panels/StatusPanel"
import { useEffect } from "react"
import { useModal } from "@/context/ModalContext"
import { useSettings } from "@/context/SettingsContext"
import Modals from "@/app/modals"
import { ToastContainer } from "@/components/layout/ToastContainer"

export default function Home() {
  const { openModal, isModalOpen, closeModal } = useModal()
  const { settings, isDisableShortcuts } = useSettings()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDisableShortcuts) return

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
    isDisableShortcuts,
  ])

  return (
    <div
      className={`relative ${settings.compactMode ? "gap-1" : "gap-2"} min-h-screen md:max-h-screen flex flex-col ${settings.compactMode ? "p-1 sm:p-2 md:p-3" : "p-2 sm:p-3 md:p-4"} bg-[rgb(var(--background))]`}
    >
      <ToastContainer />
      <Modals />
      <Header />
      <main
        className={`grid grid-cols-1 md:grid-cols-2 ${settings.compactMode ? "gap-1" : "gap-2"} flex-1 md:grid-rows-2 min-h-0 overflow-auto md:overflow-hidden pb-4 md:pb-0`}
      >
        <LinksPanel />
        <NotesPanel />
        <SnippetsPanel />
        <StatusPanel />
      </main>
    </div>
  )
}
