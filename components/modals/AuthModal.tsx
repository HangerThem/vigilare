"use client"

import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { useModal } from "@/context/ModalContext"
import { useSync } from "@/context/SyncContext"
import { useToast } from "@/context/ToastContext"
import { RotateCcw } from "lucide-react"
import { useCallback } from "react"

export default function AuthModal() {
  const sync = useSync()
  const { openModal } = useModal()
  const { addToast } = useToast()

  const handleAddPasskey = useCallback(async () => {
    try {
      await sync.registerWithPasskey(
        sync.account?.displayName || "Vigilare User",
      )
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : "Failed to add passkey",
        icon: RotateCcw,
      })
    }
  }, [addToast, sync])

  const authMethods = sync.account?.authMethods ?? []
  const hasPasskey = authMethods.includes("passkey")
  const hasCredentials = authMethods.includes("credentials")

  return (
    <Modal name="auth">
      <div className="w-full sm:w-[28rem] space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Authentication</h2>
          <p className="text-xs sm:text-sm text-[rgb(var(--muted))]">
            Manage sign-in methods for your sync account.
          </p>
        </div>

        {!sync.syncEnabled && (
          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted-background))] p-3 text-sm text-[rgb(var(--muted))]">
            Sync is disabled. Enable
            <span className="mx-1 font-mono text-[rgb(var(--foreground))]">
              NEXT_PUBLIC_SYNC_ENABLED=true
            </span>
            to use account authentication.
          </div>
        )}

        {sync.syncEnabled && !sync.isAuthenticated && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm text-[rgb(var(--muted))]">
              You are currently signed out.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => openModal("authRegister")}
              >
                Register
              </Button>
              <Button
                variant="secondary"
                onClick={() => openModal("authLogin")}
              >
                Sign In
              </Button>
            </div>
          </div>
        )}

        {sync.syncEnabled && sync.isAuthenticated && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
              <div>
                Account:{" "}
                <span className="font-medium text-[rgb(var(--foreground))]">
                  {sync.account?.displayName}
                </span>
              </div>
              <div className="mt-1">
                User ID:{" "}
                <span className="font-mono text-[rgb(var(--foreground))]">
                  {sync.account?.userId}
                </span>
              </div>
              {sync.account?.email && (
                <div className="mt-1">
                  Email:{" "}
                  <span className="font-medium text-[rgb(var(--foreground))]">
                    {sync.account.email}
                  </span>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {authMethods.map((method) => (
                  <span
                    key={method}
                    className="rounded border border-[rgb(var(--border))] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[rgb(var(--foreground))]"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {!hasCredentials && (
                <Button
                  variant="secondary"
                  onClick={() => openModal("authRegister")}
                >
                  Add Credentials
                </Button>
              )}
              {!hasPasskey && (
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => void handleAddPasskey()}
                >
                  Add Passkey
                </Button>
              )}
            </div>
            <Button
              className="w-full"
              variant="danger"
              onClick={() => void sync.logout()}
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
