"use client"

import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useModal } from "@/context/ModalContext"
import { useSync } from "@/context/SyncContext"
import { useToast } from "@/context/ToastContext"
import { RotateCcw } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

export default function AuthRegisterModal() {
  const sync = useSync()
  const { openModal } = useModal()
  const { addToast } = useToast()

  const [displayNameInput, setDisplayNameInput] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [passwordInput, setPasswordInput] = useState("")

  const fallbackDisplayName = useMemo(
    () => displayNameInput.trim() || sync.account?.displayName || "Vigilare User",
    [displayNameInput, sync.account?.displayName],
  )

  const handleCredentialsRegister = useCallback(async () => {
    try {
      await sync.registerWithCredentials(
        emailInput.trim(),
        passwordInput,
        fallbackDisplayName,
      )
      setPasswordInput("")
      openModal("auth")
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : "Failed to register credentials",
        icon: RotateCcw,
      })
    }
  }, [addToast, emailInput, fallbackDisplayName, openModal, passwordInput, sync])

  const handlePasskeyRegister = useCallback(async () => {
    try {
      await sync.registerWithPasskey(fallbackDisplayName)
      openModal("auth")
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : "Failed to register passkey",
        icon: RotateCcw,
      })
    }
  }, [addToast, fallbackDisplayName, openModal, sync])

  return (
    <Modal name="authRegister">
      <div className="w-full sm:w-[28rem] space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Register</h2>
          <p className="text-xs sm:text-sm text-[rgb(var(--muted))]">
            Create a new account or add additional sign-in methods.
          </p>
        </div>

        {!sync.syncEnabled ? (
          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted-background))] p-3 text-sm text-[rgb(var(--muted))]">
            Sync is disabled. Enable
            <span className="mx-1 font-mono text-[rgb(var(--foreground))]">
              NEXT_PUBLIC_SYNC_ENABLED=true
            </span>
            to register an account.
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="text"
              value={displayNameInput}
              onChange={(event) => setDisplayNameInput(event.target.value)}
              placeholder="Display name"
            />
            <Input
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="Email"
            />
            <Input
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              placeholder="Password"
            />
            <Button className="w-full" variant="secondary" onClick={() => void handleCredentialsRegister()}>
              Register with Credentials
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => void handlePasskeyRegister()}>
              Register with Passkey
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => openModal("authLogin")}>
              Already have an account? Sign In
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
