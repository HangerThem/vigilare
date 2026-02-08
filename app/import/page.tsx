"use client"

import { Button } from "@/components/ui/Button"
import {
  dataExists,
  importAppDataFromEncoded,
  importState,
  mergeAppDataFromEncoded
} from "@/utils/appData"
import { useSearchParams } from "next/navigation"

export default function ImportPage() {
  const searchParams = useSearchParams()

  const data = searchParams.get("data")

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-4xl font-bold">Import Page</h1>
        <p className="mt-4 text-lg">No data provided for import.</p>
      </div>
    )
  }

  const imported = importState(data) as {
    commands?: unknown[]
    links?: unknown[]
    notes?: unknown[]
    status?: unknown[]
  } | null

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="text-center bg-[rgb(var(--card))] border-2 border-[rgb(var(--border))] rounded-xl p-6">
        <h1 className="text-4xl font-bold">Import Page</h1>
        {imported && (
          <div className="mt-4 text-left">
            <p className="mt-4 text-lg">The following data will be imported:</p>
            <ul>
              {imported.commands && (
                <li>
                  <strong>Commands:</strong> {imported.commands.length} items
                </li>
              )}
              {imported.links && (
                <li>
                  <strong>Links:</strong> {imported.links.length} items
                </li>
              )}
              {imported.notes && (
                <li>
                  <strong>Notes:</strong> {imported.notes.length} items
                </li>
              )}
              {imported.status && (
                <li>
                  <strong>Status:</strong> {imported.status.length} items
                </li>
              )}
            </ul>
          </div>
        )}
        {dataExists() && (
          <p className="mt-4 text-lg text-red-500">
            You already have existing data. Do you want to overwrite it or merge
            with the imported data?
          </p>
        )}
        <Button
          className="mt-6"
          onClick={() => {
            importAppDataFromEncoded(data)
            window.location.href = "/"
          }}
        >
          Overwrite Existing Data
        </Button>
        {dataExists() && (
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => {
              mergeAppDataFromEncoded(data)
              window.location.href = "/"
            }}
          >
            Merge with Existing Data
          </Button>
        )}
      </div>
    </div>
  )
}
