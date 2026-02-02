"use client"

import { CommandsPanel } from "@/components/panels/CommandsPanel"
import { Header } from "@/components/Header"
import { LinksPanel } from "@/components/panels/LinksPanel"
import { NotesPanel } from "@/components/panels/NotesPanel"
import { StatusPanel } from "@/components/panels/StatusPanel"
import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      // e.preventDefault()
    })
  }, [])
  return (
    <div className="gap-2 min-h-screen max-h-screen flex flex-col p-6">
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
