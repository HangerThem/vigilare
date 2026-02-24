"use client"

import CommandPaletteModal from "@/components/modals/CommandPaletteModal"
import GlobalSearchModal from "@/components/modals/GlobalSearchModal"
import ShortcutsModal from "@/components/modals/ShortcutsModal"
import SettingsModal from "@/components/modals/SettingsModal"
import ConfirmModal from "@/components/modals/ConfirmModal"
import SyncModal from "@/components/modals/SyncModal"
import AuthModal from "@/components/modals/AuthModal"
import AuthRegisterModal from "@/components/modals/AuthRegisterModal"
import AuthLoginModal from "@/components/modals/AuthLoginModal"

export default function Modals() {
  return (
    <>
      <CommandPaletteModal />
      <GlobalSearchModal />
      <ShortcutsModal />
      <SettingsModal />
      <SyncModal />
      <AuthModal />
      <AuthRegisterModal />
      <AuthLoginModal />
      <ConfirmModal />
    </>
  )
}
