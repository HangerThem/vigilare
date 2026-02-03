"use client"

import { CommandsPanel } from "@/components/panels/CommandsPanel"
import { Header } from "@/components/Header"
import { LinksPanel } from "@/components/panels/LinksPanel"
import { NotesPanel } from "@/components/panels/NotesPanel"
import { StatusPanel } from "@/components/panels/StatusPanel"
import { useEffect, useState } from "react"
import CommandModal, { Command } from "@/components/modals/CommandModal"
import { usePanelAdd } from "@/context/PanelAddContext"
import {
  Download,
  Import,
  Link,
  Network,
  Notebook,
  Terminal,
} from "lucide-react"
import GlobalSearchModal from "@/components/modals/GlobalSearchModal"
import { downloadAppData, importAllAppData } from "@/utils/appData"

export default function Home() {
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [commandModalOpen, setCommandModalOpen] = useState(false)
  const [commands] = useState<Command[]>([
    {
      icon: <Link size={16} />,
      name: "New Link",
      action: () => {
        openAdd("links")
      },
    },
    {
      icon: <Notebook size={16} />,
      name: "New Note",
      action: () => {
        openAdd("notes")
      },
    },
    {
      icon: <Terminal size={16} />,
      name: "New Command",
      action: () => {
        openAdd("commands")
      },
    },
    {
      icon: <Network size={16} />,
      name: "New Status",
      action: () => {
        openAdd("status")
      },
    },
    {
      icon: <Download size={16} />,
      name: "Export Data",
      action: () => {
        downloadAppData()
      },
    },
    {
      icon: <Import size={16} />,
      name: "Import Data",
      action: () => {
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = ".json"
        fileInput.onchange = () => {
          const reader = new FileReader()
          reader.onload = (e) => {
            importAllAppData(e.target?.result as string)
            window.location.reload()
          }
          reader.readAsText(fileInput.files?.[0] as Blob)
        }
        fileInput.click()
      },
    },
  ])

  const { openAdd } = usePanelAdd()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandModalOpen((prev) => !prev)
      } else if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setGlobalSearchOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [commandModalOpen])

  return (
    <div className="gap-2 min-h-screen md:max-h-screen flex flex-col p-6">
      <CommandModal
        isOpen={commandModalOpen}
        onClose={() => setCommandModalOpen(false)}
        commands={commands}
      />
      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
      />
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
