"use client"

import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useModal } from "@/context/ModalContext"
import { useSync } from "@/context/SyncContext"
import { useToast } from "@/context/ToastContext"
import { RotateCcw } from "lucide-react"
import { useCallback, useState } from "react"

export default function AuthLoginModal() {
  const sync = useSync()
  const { openModal } = useModal()
  const { addToast } = useToast()

  const [emailInput, setEmailInput] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [resetTokenInput, setResetTokenInput] = useState("")
  const [newPasswordInput, setNewPasswordInput] = useState("")

  const handleCredentialsLogin = useCallback(async () => {
    try {
      await sync.loginWithCredentials(emailInput.trim(), passwordInput)
      setPasswordInput("")
      openModal("auth")
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : "Failed to sign in",
        icon: RotateCcw,
      })
    }
  }, [addToast, emailInput, openModal, passwordInput, sync])

  const handlePasskeyLogin = useCallback(async () => {
    try {
      await sync.loginWithPasskey()
      openModal("auth")
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : "Failed to sign in",
        icon: RotateCcw,
      })
    }
  }, [addToast, openModal, sync])

  const handleRequestReset = useCallback(async () => {
    try {
      await sync.requestPasswordReset(emailInput.trim())
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : "Failed to request reset",
        icon: RotateCcw,
      })
    }
  }, [addToast, emailInput, sync])

  const handleConfirmReset = useCallback(async () => {
    try {
      await sync.confirmPasswordReset(
        emailInput.trim(),
        resetTokenInput.trim(),
        newPasswordInput,
      )
      setResetTokenInput("")
      setNewPasswordInput("")
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : "Failed to reset password",
        icon: RotateCcw,
      })
    }
  }, [addToast, emailInput, newPasswordInput, resetTokenInput, sync])

  return (
    <Modal name="authLogin">
      <div className="w-full sm:w-[28rem] space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Sign In</h2>
          <p className="text-xs sm:text-sm text-[rgb(var(--muted))]">
            Use credentials or passkey to access remote workspaces.
          </p>
        </div>

        {!sync.syncEnabled ? (
          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted-background))] p-3 text-sm text-[rgb(var(--muted))]">
            Sync is disabled. Enable
            <span className="mx-1 font-mono text-[rgb(var(--foreground))]">
              NEXT_PUBLIC_SYNC_ENABLED=true
            </span>
            to sign in.
          </div>
        ) : (
          <div className="space-y-3">
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
            <Button className="w-full" variant="secondary" onClick={() => void handleCredentialsLogin()}>
              Sign In with Credentials
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => void handlePasskeyLogin()}>
              Sign In with Passkey
            </Button>

            <div className="rounded-lg border border-[rgb(var(--border))] p-3 space-y-2">
              <div className="text-xs text-[rgb(var(--muted))]">Password Reset</div>
              <Button className="w-full" variant="ghost" onClick={() => void handleRequestReset()}>
                Request Password Reset
              </Button>
              <Input
                type="text"
                value={resetTokenInput}
                onChange={(event) => setResetTokenInput(event.target.value)}
                placeholder="Reset token"
              />
              <Input
                type="password"
                value={newPasswordInput}
                onChange={(event) => setNewPasswordInput(event.target.value)}
                placeholder="New password"
              />
              <Button className="w-full" variant="ghost" onClick={() => void handleConfirmReset()}>
                Confirm Password Reset
              </Button>
            </div>

            <Button className="w-full" variant="ghost" onClick={() => openModal("authRegister")}>
              Need an account? Register
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
