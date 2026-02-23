"use client"

import CommandPaletteModal from "@/components/modals/CommandPaletteModal"
import GlobalSearchModal from "@/components/modals/GlobalSearchModal"
import ShortcutsModal from "@/components/modals/ShortcutsModal"
import SettingsModal from "@/components/modals/SettingsModal"
import ConfirmModal from "@/components/modals/ConfirmModal"
import SyncModal from "@/components/modals/SyncModal"

export default function Modals() {
  return (
    <>
      <CommandPaletteModal />
      <GlobalSearchModal />
      <ShortcutsModal />
      <SettingsModal />
      <SyncModal />
      <ConfirmModal />
    </>
  )
}
