"use client"

import { SnippetsPanel } from "@/components/panels/SnippetsPanel"
import { Header } from "@/components/layout/Header"
import { LinksPanel } from "@/components/panels/LinksPanel"
import { NotesPanel } from "@/components/panels/NotesPanel"
import { StatusPanel } from "@/components/panels/StatusPanel"
import { CSSProperties, ReactNode, useEffect } from "react"
import { useModal } from "@/context/ModalContext"
import { PanelKey, useSettings } from "@/context/SettingsContext"
import Modals from "@/app/modals"
import { ToastContainer } from "@/components/layout/ToastContainer"
import {
  getDesktopGridClass,
  getFeaturedPanel,
  getOrderedVisiblePanels,
} from "@/utils/layout"

export default function Home() {
  const { openModal, isModalOpen, closeModal } = useModal()
  const { settings, isDisableShortcuts } = useSettings()
  const panelComponents: Record<PanelKey, ReactNode> = {
    links: <LinksPanel />,
    notes: <NotesPanel />,
    snippets: <SnippetsPanel />,
    status: <StatusPanel />,
  }
  const renderedPanels = getOrderedVisiblePanels(settings)
  const desktopLayoutClass = getDesktopGridClass(settings, renderedPanels)
  const featuredPanel = getFeaturedPanel(settings, renderedPanels)
  const isFocusPreset =
    settings.layoutPreset === "focusLeft" || settings.layoutPreset === "focusRight"
  const sidePanelCount = Math.max(renderedPanels.length - 1, 1)
  const focusGridClass =
    isFocusPreset && featuredPanel
      ? "md:[grid-template-rows:repeat(var(--focus-side-rows),minmax(0,1fr))]"
      : ""
  const focusGridStyle =
    isFocusPreset && featuredPanel
      ? ({
          ["--focus-side-rows"]: String(sidePanelCount),
        } as CSSProperties)
      : undefined
  const sidePanelRowStarts: Partial<Record<PanelKey, number>> = {}

  if (isFocusPreset && featuredPanel) {
    renderedPanels
      .filter((panel) => panel !== featuredPanel)
      .forEach((panel, index) => {
        sidePanelRowStarts[panel] = index + 1
      })
  }

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
      className={`relative ${settings.compactMode ? "gap-1" : "gap-2"} min-h-screen md:h-[100dvh] md:min-h-0 md:overflow-hidden flex flex-col ${settings.compactMode ? "p-1 sm:p-2 md:p-3" : "p-2 sm:p-3 md:p-4"} bg-[rgb(var(--background))]`}
    >
      <ToastContainer />
      <Modals />
      <Header />
      <main
        className={`grid grid-cols-1 ${desktopLayoutClass} ${focusGridClass} ${settings.compactMode ? "gap-1" : "gap-2"} flex-1 min-h-0 overflow-auto md:overflow-hidden pb-4 md:pb-0`}
        style={focusGridStyle}
      >
        {renderedPanels.map((panel) => {
          const sideRowStart = sidePanelRowStarts[panel]
          const isFocusedPanel = panel === featuredPanel
          const panelClassName =
            !isFocusedPanel
              ? isFocusPreset && featuredPanel
                ? `${settings.layoutPreset === "focusRight" ? "md:col-start-1" : "md:col-start-3"} md:[grid-row-start:var(--side-panel-row)] md:[grid-row-end:span_1] min-h-0`
                : "min-h-0"
              : settings.layoutPreset === "focusRight"
                ? "md:col-start-2 md:col-span-2 md:[grid-row:1/-1] min-h-0"
                : settings.layoutPreset === "focusLeft"
                  ? "md:col-span-2 md:[grid-row:1/-1] min-h-0"
                  : "md:col-span-2 md:row-span-2 min-h-0"
          const panelStyle =
            !isFocusedPanel && isFocusPreset && featuredPanel && sideRowStart
              ? ({
                  ["--side-panel-row"]: String(sideRowStart),
                } as CSSProperties)
              : undefined

          return (
            <div key={panel} className={panelClassName} style={panelStyle}>
              {panelComponents[panel]}
            </div>
          )
        })}
      </main>
    </div>
  )
}
