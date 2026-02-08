"use client"

import CommandPaletteModal from "@/components/modals/CommandPaletteModal"
import GlobalSearchModal from "@/components/modals/GlobalSearchModal"
import ShortcutsModal from "@/components/modals/ShortcutsModal"
import SettingsModal from "@/components/modals/SettingsModal"
import ConfirmModal from "@/components/modals/ConfirmModal"
import ImportFromTextModal from "@/components/modals/ImportFromTextModal"

export default function Modals() {
  return (
    <>
      <CommandPaletteModal />
      <GlobalSearchModal />
      <ShortcutsModal />
      <SettingsModal />
      <ConfirmModal />
      <ImportFromTextModal />
    </>
  )
}
