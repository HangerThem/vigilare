"use client"

import { useEffect, useCallback, useRef } from "react"
import { useSettings } from "@/context/SettingsContext"
import { exportAppData } from "@/utils/appData"

export const LAST_BACKUP_KEY = "lastAutoBackupTimestamp"

function getLastBackupTimestamp(): number | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(LAST_BACKUP_KEY)
  return stored ? parseInt(stored, 10) : null
}

function setLastBackupTimestamp(timestamp: number): void {
  localStorage.setItem(LAST_BACKUP_KEY, timestamp.toString())
}

function downloadBackup(): void {
  const data = exportAppData()
  const date = new Date().toISOString().split("T")[0]
  const filename = `vigilare-auto-backup-${date}.json`

  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()

  URL.revokeObjectURL(url)
}

export function useAutoBackup() {
  const { settings } = useSettings()
  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const performBackup = useCallback(() => {
    console.log("AutoBackup: Performing backup...")
    downloadBackup()
    setLastBackupTimestamp(Date.now())
    console.log("AutoBackup: Backup completed!")
  }, [])

  const isBackupDue = useCallback((): boolean => {
    const lastBackup = getLastBackupTimestamp()
    console.log("AutoBackup: Last backup timestamp:", lastBackup)
    if (!lastBackup) return true

    const intervalMs =
      settingsRef.current.autoBackupIntervalDays * 24 * 60 * 60 * 1000
    const now = Date.now()
    const timeSinceLastBackup = now - lastBackup
    console.log(
      `AutoBackup: Time since last backup: ${timeSinceLastBackup}ms, interval: ${intervalMs}ms`,
    )

    return timeSinceLastBackup >= intervalMs
  }, [])

  const checkAndBackup = useCallback(() => {
    console.log(
      "AutoBackup: Checking... enabled:",
      settingsRef.current.autoBackupEnabled,
    )
    if (!settingsRef.current.autoBackupEnabled) {
      console.log("AutoBackup: Auto-backup is disabled")
      return
    }

    if (isBackupDue()) {
      console.log("AutoBackup: Backup is due, triggering...")
      performBackup()
    } else {
      console.log("AutoBackup: Backup not due yet")
    }
  }, [isBackupDue, performBackup])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (sessionStorage.getItem("autoBackupChecked") === "true") {
      console.log("AutoBackup: Already checked this session, skipping")
      return
    }

    console.log("AutoBackup: Setting up timer...")
    const timer = setTimeout(() => {
      console.log("AutoBackup: Timer fired, checking for backup...")
      sessionStorage.setItem("autoBackupChecked", "true")
      checkAndBackup()
    }, 2000)

    return () => {
      console.log("AutoBackup: Cleanup")
      clearTimeout(timer)
    }
  }, [checkAndBackup])

  return {
    performBackup,
    isBackupDue,
    getLastBackupDate: () => {
      const timestamp = getLastBackupTimestamp()
      return timestamp ? new Date(timestamp) : null
    },
    daysSinceLastBackup: () => {
      const lastBackup = getLastBackupTimestamp()
      if (!lastBackup) return null
      const now = Date.now()
      return Math.floor((now - lastBackup) / (24 * 60 * 60 * 1000))
    },
  }
}
