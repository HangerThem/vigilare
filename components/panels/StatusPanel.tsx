"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import {
  Bell,
  BellOff,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash,
} from "lucide-react"
import { nanoid } from "nanoid"
import SortableJS from "sortablejs"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"
import Panel from "./Panel"
import Modal from "../modals/Modal"
import { useForm } from "react-hook-form"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { usePanelAdd } from "@/context/PanelAddContext"
import { useNotifications, StatusItem } from "@/hook/useNotifications"

enum StatusEnum {
  UP = "up",
  DOWN = "down",
  UNKNOWN = "unknown",
}

export type StatusType = {
  id: string
  url: string
  title: string
  status: StatusEnum
}

type StatusFormData = Omit<StatusType, "id" | "status">

const categoryColors: Record<StatusEnum, string> = {
  [StatusEnum.UP]: "bg-green-500",
  [StatusEnum.DOWN]: "bg-red-500",
  [StatusEnum.UNKNOWN]: "bg-gray-500",
}

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)
  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

function getOnlineStatus() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true
}

export function StatusPanel() {
  const listRef = useRef<HTMLDivElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const statusesRef = useRef<StatusType[]>([])
  const { value: statuses, setValue: setStatuses } = useLocalStorageState<
    StatusType[]
  >("status", [])
  const [editingId, setEditingId] = useState<string | null>(null)
  const { isAdding, openAdd, closeAdd } = usePanelAdd()
  const addingStatus = isAdding("status")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const handleStatusUpdateFromSW = useCallback(
    (updatedStatuses: StatusItem[]) => {
      setStatuses(updatedStatuses as StatusType[])
    },
    [setStatuses],
  )

  const {
    isSupported,
    isMonitoring,
    notificationsEnabled,
    checkInterval,
    setCheckInterval,
    startMonitoring,
    stopMonitoring,
    enableNotifications,
    disableNotifications,
  } = useNotifications(handleStatusUpdateFromSW)

  useEffect(() => {
    statusesRef.current = statuses
  }, [statuses])

  useEffect(() => {
    if (statuses.length > 0 && !isMonitoring) {
      startMonitoring(statuses)
    } else if (statuses.length === 0 && isMonitoring) {
      stopMonitoring()
    }
  }, [statuses, isMonitoring, startMonitoring, stopMonitoring])

  useEffect(() => {
    if (isMonitoring && statuses.length > 0) {
      startMonitoring(statuses)
    }
  }, [statuses]) // eslint-disable-line react-hooks/exhaustive-deps

  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineStatus,
    getServerSnapshot,
  )

  const { register, handleSubmit, reset } = useForm<StatusFormData>()

  const handleSortEnd = useCallback(() => {
    const items = listRef.current?.querySelectorAll("[data-id]")
    if (!items) return
    const newOrder = Array.from(items).map(
      (item) => item.getAttribute("data-id")!,
    )
    setStatuses((prev) => {
      const statusMap = new Map(prev.map((s) => [s.id, s]))
      return newOrder.map((id) => statusMap.get(id)!)
    })
  }, [setStatuses])

  useEffect(() => {
    if (listRef.current && !sortableRef.current) {
      sortableRef.current = SortableJS.create(listRef.current, {
        animation: 150,
        handle: ".handle",
        onEnd: handleSortEnd,
      })
    }
    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy()
        sortableRef.current = null
      }
    }
  }, [handleSortEnd])

  const handleDelete = (id: string) => {
    setStatuses(statuses.filter((status) => status.id !== id))
  }

  const handleAddStatus = async (data: StatusFormData) => {
    const { url, title } = data
    const newStatusId = nanoid()
    setStatuses([
      ...statuses,
      { id: newStatusId, url, title, status: StatusEnum.UNKNOWN },
    ])
    closeAdd()
    const status = await fetch(url)
      .then((res) => (res.ok ? StatusEnum.UP : StatusEnum.DOWN))
      .catch(() => StatusEnum.DOWN)
    setStatuses((prevStatuses) =>
      prevStatuses.map((statusItem) =>
        statusItem.id === newStatusId ? { ...statusItem, status } : statusItem,
      ),
    )
  }

  const toggleNotifications = useCallback(async () => {
    if (notificationsEnabled) {
      disableNotifications()
    } else {
      const enabled = await enableNotifications()
      if (!enabled) {
        alert(
          "Notification permission denied. Please enable notifications in your browser settings.",
        )
      }
    }
  }, [notificationsEnabled, enableNotifications, disableNotifications])

  const handleEditStatus = (data: StatusFormData) => {
    const { url, title } = data
    const newStatuses = [...statuses]
    const index = newStatuses.findIndex((status) => status.id === editingId!)
    const oldStatus = newStatuses[index]
    newStatuses[index] = { ...oldStatus, url, title }
    setStatuses(newStatuses)
    setEditingId(null)
    if (oldStatus.url !== url) {
      fetch(url)
        .then((res) => (res.ok ? StatusEnum.UP : StatusEnum.DOWN))
        .catch(() => StatusEnum.DOWN)
        .then((status) => {
          setStatuses((prevStatuses) =>
            prevStatuses.map((statusItem) =>
              statusItem.id === editingId
                ? { ...statusItem, status }
                : statusItem,
            ),
          )
        })
    }
  }

  const filteredStatuses = useMemo(() => {
    if (searchQuery.trim() === "") return statuses
    const fuse = new Fuse(statuses, {
      keys: ["name", "url"],
      threshold: 0.3,
    })
    return fuse.search(searchQuery).map((result) => result.item)
  }, [statuses, searchQuery])

  return (
    <Panel>
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
          />
          <h2 className="font-bold text-2xl">Status</h2>
        </div>

        <div className="flex w-56 items-center gap-2 p-2 text-sm border border-neutral-300 rounded-lg focus:border-neutral-500 transition-colors mr-auto">
          <input
            type="text"
            placeholder="Search statuses..."
            className="w-full outline-none bg-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} className="text-neutral-400" />
        </div>

        {isSupported && (
          <div className="flex items-center gap-2">
            <select
              value={checkInterval}
              onChange={(e) => setCheckInterval(Number(e.target.value))}
              className="p-2 rounded-lg border border-neutral-300 text-sm bg-white hover:border-neutral-400 transition-colors"
              title="Check interval"
            >
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={15000}>15s</option>
              <option value={30000}>30s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
            </select>
            <Button
              onClick={toggleNotifications}
              className={
                notificationsEnabled
                  ? "border-green-500 bg-green-50 text-green-600 hover:bg-green-100 hover:border-green-600"
                  : "border-neutral-300 text-neutral-500 hover:border-neutral-400"
              }
              title={
                notificationsEnabled
                  ? "Notifications enabled - Click to disable"
                  : "Enable notifications for status changes"
              }
            >
              {notificationsEnabled ? (
                <Bell size={20} />
              ) : (
                <BellOff size={20} />
              )}
            </Button>
          </div>
        )}
        <Button
          onClick={() => {
            reset({ url: "", title: "" })
            openAdd("status")
          }}
        >
          <Plus size={20} />
        </Button>
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-auto min-h-0 -mr-3 pr-3"
        ref={listRef}
      >
        <AnimatePresence>
          {filteredStatuses.length > 0 ? (
            filteredStatuses.map((status) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
                key={status.id}
                data-id={status.id}
              >
                <Link
                  href={status.url}
                  target="_blank"
                  className="relative overflow-hidden flex items-center p-2 rounded-lg border border-neutral-300 hover:border-neutral-400 transition-colors"
                >
                  <div
                    className={`absolute w-2 h-full left-0 ${categoryColors[status.status]}`}
                  ></div>

                  <div className="flex gap-2 absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setEditingId(status.id)
                        reset({
                          url: status.url,
                          title: status.title,
                        })
                      }}
                      className="text-neutral-400 hover:text-neutral-500 transition-colors cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(status.id)
                      }}
                      className="text-neutral-400 hover:text-neutral-500 transition-colors cursor-pointer"
                    >
                      <Trash size={16} />
                    </button>
                  </div>

                  <GripVertical
                    size="20"
                    className="mx-1 handle cursor-move text-neutral-400 hover:text-neutral-600 transition-colors"
                  />
                  <div className="mr-auto">
                    <span className="block font-medium">{status.title}</span>
                    <span className="block text-xs text-neutral-500">
                      {status.url}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="text-neutral-500">No statuses added yet.</div>
          )}
        </AnimatePresence>
      </div>
      <Modal
        isOpen={addingStatus || editingId !== null}
        onClose={() => {
          closeAdd()
          setEditingId(null)
        }}
      >
        <h2 className="font-bold text-2xl mb-4">
          {addingStatus ? "Add Status" : "Edit Status"}
        </h2>
        <form
          onSubmit={handleSubmit(
            addingStatus ? handleAddStatus : handleEditStatus,
          )}
          className="flex flex-col gap-2 p-2 w-96"
        >
          <input
            {...register("title")}
            placeholder="Title"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <input
            {...register("url")}
            type="url"
            placeholder="URL"
            required
            className="p-2 border border-neutral-300 rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                closeAdd()
                setEditingId(null)
              }}
              className="px-4 py-2 rounded-lg border border-neutral-300 hover:border-neutral-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {addingStatus ? "Add" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </Panel>
  )
}
