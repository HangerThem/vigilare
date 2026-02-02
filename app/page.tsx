"use client"

import { CommandsPanel } from "@/components/panels/CommandsPanel"
import { Header } from "@/components/Header"
import { LinksPanel } from "@/components/panels/LinksPanel"
import { NotesPanel } from "@/components/panels/NotesPanel"
import { StatusPanel } from "@/components/panels/StatusPanel"
import { useEffect, useState } from "react"
import CommandModal from "@/components/modals/CommandModal"

export default function Home() {
  const [commandModalOpen, setCommandModalOpen] = useState(false)
  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandModalOpen((prev) => !prev)
      }
    })
  }, [])
  return (
    <div className="gap-2 min-h-screen max-h-screen flex flex-col p-6">
      <CommandModal
        isOpen={commandModalOpen}
        onClose={() => setCommandModalOpen(false)}
        commands={[
          {
            name: "New Link",
            action: () => {
              console.log("New Link command executed")
            },
          },
          {
            name: "New Note",
            action: () => {
              console.log("New Note command executed")
            },
          },
        ]}
      />
      <Header />
      <main className="grid grid-cols-2 gap-2 flex-1 grid-rows-2 min-h-0">
        <LinksPanel />
        <NotesPanel />
        <CommandsPanel />
        <StatusPanel />
      </main>
    </div>
  )
}
