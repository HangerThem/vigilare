"use client"

import { useEffect, useRef, useState } from "react"
import { GripVertical, Plus, RefreshCcw, Trash } from "lucide-react"
import { nanoid } from "nanoid"
import SortableJS from "sortablejs"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../ui/Button"

enum StatusEnum {
  UP = "up",
  DOWN = "down",
  UNKNOWN = "unknown",
}

export type StatusType = {
  id: string
  url: string
  name: string
  status: StatusEnum
}

const categoryColors: Record<StatusEnum, string> = {
  [StatusEnum.UP]: "bg-green-500",
  [StatusEnum.DOWN]: "bg-red-500",
  [StatusEnum.UNKNOWN]: "bg-gray-500",
}

export function StatusPanel() {
  const listRef = useRef<HTMLDivElement>(null)
  const [statuses, setStatuses] = useState<StatusType[]>(() => {
    const savedStatuses = localStorage.getItem("statuses")
    return savedStatuses ? JSON.parse(savedStatuses) : []
  })

  const [refreshing, setRefreshing] = useState<boolean>(false)

  const [addingStatus, setAddingStatus] = useState<boolean>(false)

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!listRef.current) return

    const sortable = SortableJS.create(listRef.current, {
      animation: 150,
      handle: ".handle",
      onEnd: () => {
        const items = listRef.current?.querySelectorAll("[data-id]")
        if (!items) return
        const newOrder = Array.from(items).map(
          (item) => item.getAttribute("data-id")!,
        )
        setStatuses((prev) => {
          const statusMap = new Map(prev.map((s) => [s.id, s]))
          return newOrder.map((id) => statusMap.get(id)!)
        })
      },
    })

    return () => sortable.destroy()
  }, [])

  const handleDelete = (id: string) => {
    setStatuses(statuses.filter((status) => status.id !== id))
  }

  const handleAddStatus = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newStatusId = nanoid()
    const url = formData.get("url") as string
    const name = formData.get("name") as string
    setStatuses([
      ...statuses,
      { id: newStatusId, url, name, status: StatusEnum.UNKNOWN },
    ])
    e.currentTarget.reset()
    setAddingStatus(false)
    const status = await fetch(url)
      .then((res) => (res.ok ? StatusEnum.UP : StatusEnum.DOWN))
      .catch(() => StatusEnum.DOWN)
    setStatuses((prevStatuses) =>
      prevStatuses.map((statusItem) =>
        statusItem.id === newStatusId ? { ...statusItem, status } : statusItem,
      ),
    )
  }

  useEffect(() => {
    localStorage.setItem("statuses", JSON.stringify(statuses))
  }, [statuses])

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshing(true)
      const updateStatuses = async () => {
        const updatedStatuses = await Promise.all(
          statuses.map(async (status) => {
            try {
              const response = await fetch(status.url)
              return {
                ...status,
                status: response.ok ? StatusEnum.UP : StatusEnum.DOWN,
              }
            } catch {
              return { ...status, status: StatusEnum.DOWN }
            }
          }),
        )
        setStatuses(updatedStatuses)
        setRefreshing(false)
      }

      updateStatuses()
    }, 60000)

    return () => clearInterval(interval)
  }, [statuses])

  return (
    <section className="w-full border-2 rounded-xl border-neutral-200 p-4 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
          />
          <h2 className="font-bold text-2xl">Status</h2>
          {refreshing && (
            <motion.div
              className="ml-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCcw size={16} className="text-neutral-500" />
            </motion.div>
          )}
        </div>

        <Button onClick={() => setAddingStatus(true)}>
          <Plus size={20} />
          Add status
        </Button>
      </div>
      <div
        className="grid grid-cols-2 gap-2 overflow-auto flex-1 min-h-0"
        ref={listRef}
      >
        {statuses.length > 0 &&
          statuses.map((status) => (
            <div key={status.id} data-id={status.id}>
              <Link
                href={status.url}
                target="_blank"
                className="relative overflow-hidden flex items-center p-2 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors"
              >
                <div
                  className={`absolute w-2 h-full left-0 ${categoryColors[status.status]}`}
                ></div>
                <GripVertical
                  size="20"
                  className="mx-1 handle cursor-move text-neutral-400 hover:text-neutral-600 transition-colors"
                />
                <div className="mr-auto">
                  <span className="block font-medium">{status.name}</span>
                  <span className="block text-xs text-neutral-500">
                    {status.url}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete(status.id)
                  }}
                  className="p-1 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors"
                >
                  <Trash size={16} />
                </button>
              </Link>
            </div>
          ))}
        {statuses.length === 0 && !addingStatus && (
          <div className="text-neutral-500">No statuses added yet.</div>
        )}
      </div>
      {addingStatus && (
        <form
          onSubmit={handleAddStatus}
          className="flex flex-col gap-2 p-2 rounded-lg border border-neutral-300 mt-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <input
            type="url"
            name="url"
            placeholder="URL"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddingStatus(false)}
              className="px-4 py-2 rounded-lg border border-neutral-300 hover:border-neutral-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
