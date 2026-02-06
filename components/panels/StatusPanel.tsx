"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Bell, BellOff, Network, Plus, Search } from "lucide-react"
import SortableJS from "sortablejs"

import { motion, AnimatePresence } from "framer-motion"
import Fuse from "fuse.js"
import { Button } from "../ui/Button"
import Panel from "./Panel"
import StatusFormModal from "../modals/StatusFormModal"
import { useStatuses, StatusType } from "@/context/DataContext"
import { useModal } from "@/context/ModalContext"
import { useNotifications } from "@/hook/useNotifications"
import { Select } from "../ui/Select"
import { Input } from "../ui/Input"
import { useOnline } from "@/hook/useOnline"
import StatusItem from "./items/StatusItem"
import { useSettings } from "@/context/SettingsContext"

export type { StatusState, StatusType } from "@/context/DataContext"

export function StatusPanel() {
  const listRef = useRef<HTMLDivElement>(null)
  const sortableRef = useRef<SortableJS | null>(null)
  const statusesRef = useRef<StatusType[]>([])
  const {
    items: statuses,
    reorder,
    setItems: setStatuses,
    setEditingId,
  } = useStatuses()
  const { openModal } = useModal()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const isOnline = useOnline()
  const { settings } = useSettings()

  const handleStatusUpdateFromSW = useCallback(
    (updatedStatuses: StatusType[]) => {
      setStatuses(updatedStatuses)
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
    updateStatuses,
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
      updateStatuses(statuses)
    }
  }, [statuses, isMonitoring, updateStatuses])

  const handleSortEnd = useCallback(
    (evt: SortableJS.SortableEvent) => {
      reorder(evt.oldIndex!, evt.newIndex!)
    },
    [reorder],
  )

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

  const filteredStatuses = useMemo(() => {
    if (searchQuery.trim() === "") return statuses
    const fuse = new Fuse(statuses, {
      keys: ["title", "url", "option"],
      threshold: settings.fuzzySearchThreshold,
    })
    return fuse.search(searchQuery).map((result) => result.item)
  }, [statuses, searchQuery, settings.fuzzySearchThreshold])

  const [showAll, setShowAll] = useState(false)

  const displayedStatuses = useMemo(() => {
    if (
      showAll ||
      settings.maxItemsPerPanel === 0 ||
      searchQuery.trim() !== ""
    ) {
      return filteredStatuses
    }
    return filteredStatuses.slice(0, settings.maxItemsPerPanel)
  }, [filteredStatuses, settings.maxItemsPerPanel, showAll, searchQuery])

  const hasMoreItems = filteredStatuses.length > displayedStatuses.length
  const hiddenCount = filteredStatuses.length - displayedStatuses.length

  return (
    <Panel>
      <StatusFormModal />

      <div
        className={`flex flex-wrap items-center gap-2 ${settings.compactMode ? "mb-2 sm:mb-3" : "mb-3 sm:mb-4"} flex-shrink-0`}
      >
        <div className="flex items-center gap-2">
          {settings.showOfflineIndicator && (
            <div
              className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
            />
          )}
          <h2
            className={`font-bold ${settings.compactMode ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}
          >
            Statuses
          </h2>
        </div>

        <div className="flex items-center gap-2 ml-auto order-2 sm:order-3">
          {isSupported && (
            <div className="hidden sm:flex items-center gap-2">
              <Select
                options={[
                  { value: 5000, label: "5 secs" },
                  { value: 30000, label: "30 secs" },
                  { value: 60000, label: "1 mins" },
                  { value: 900000, label: "15 mins" },
                  { value: 3600000, label: "60 mins" },
                ]}
                value={checkInterval}
                onChange={(value) => setCheckInterval(Number(value))}
                className="w-28 sm:w-32"
              />
              <Button
                onClick={toggleNotifications}
                className={
                  notificationsEnabled
                    ? "border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:border-green-600"
                    : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-[rgb(var(--border-hover))]"
                }
                variant="secondary"
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
              setEditingId(null)
              openModal("status")
            }}
            variant="secondary"
          >
            <Plus size={20} />
          </Button>
        </div>

        <div className="order-3 sm:order-2 w-full sm:w-auto sm:flex-1 sm:max-w-56 flex items-center gap-2 p-2 text-sm border border-[rgb(var(--border))] rounded-lg focus-within:border-[rgb(var(--border-hover))] transition-colors">
          <Input
            type="text"
            placeholder="Search statuses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="ghost"
          />
          <Search size={16} className="text-[rgb(var(--muted))]" />
        </div>

        {isSupported && (
          <div className="flex sm:hidden items-center gap-2 order-4 w-full justify-between">
            <Select
              options={[
                { value: 5000, label: "5 secs" },
                { value: 30000, label: "30 secs" },
                { value: 60000, label: "1 mins" },
                { value: 900000, label: "15 mins" },
                { value: 3600000, label: "60 mins" },
              ]}
              value={checkInterval}
              onChange={(value) => setCheckInterval(Number(value))}
              className="flex-1"
            />
            <Button
              onClick={toggleNotifications}
              className={
                notificationsEnabled
                  ? "border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:border-green-600"
                  : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-[rgb(var(--border-hover))]"
              }
              variant="secondary"
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
      </div>
      <div className="flex-1 relative">
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${settings.compactMode ? "gap-1" : "gap-2"} overflow-auto min-h-0 -mr-3 pr-3`}
          ref={listRef}
        >
          <AnimatePresence>
            {displayedStatuses.length > 0 ? (
              displayedStatuses.map((status) => (
                <StatusItem
                  status={status}
                  key={status.id}
                  data-id={status.id}
                />
              ))
            ) : statuses.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 text-[rgb(var(--muted))] flex items-center justify-center"
              >
                <Network size={16} className="inline mr-2" />
                No statuses added yet.
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 text-[rgb(var(--muted))] flex items-center justify-center"
              >
                <Network size={16} className="inline mr-2" />
                No statuses found.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {hasMoreItems && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-2 text-sm text-[rgb(var(--primary))] hover:underline cursor-pointer flex-shrink-0"
          >
            Show {hiddenCount} more item{hiddenCount > 1 ? "s" : ""}...
          </button>
        )}
        {showAll &&
          settings.maxItemsPerPanel > 0 &&
          filteredStatuses.length > settings.maxItemsPerPanel &&
          searchQuery.trim() === "" && (
            <button
              onClick={() => setShowAll(false)}
              className="mt-2 text-sm text-[rgb(var(--muted))] hover:underline cursor-pointer flex-shrink-0"
            >
              Show less
            </button>
          )}
      </div>
    </Panel>
  )
}
