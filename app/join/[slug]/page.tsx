"use client"

import { SubmitEvent, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useSync } from "@/context/SyncContext"
import { useToast } from "@/context/ToastContext"
import { RotateCcw } from "lucide-react"

export default function JoinWorkspacePage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const { addToast } = useToast()
  const sync = useSync()

  const slugValue = params.slug
  const slug = Array.isArray(slugValue) ? slugValue[0] : slugValue
  const [code, setCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!code.trim()) {
      addToast({
        message: "Invite code is required",
        icon: RotateCcw,
      })
      return
    }

    if (!slug) {
      addToast({
        message: "Invite slug is missing from URL",
        icon: RotateCcw,
      })
      return
    }

    try {
      setIsJoining(true)
      await sync.joinWorkspaceWithCode(slug, code.trim())
      router.push("/")
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : "Failed to join workspace",
        icon: RotateCcw,
      })
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[rgb(var(--background))]">
      <section className="w-full max-w-md rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-6 space-y-4">
        <h1 className="text-xl font-bold">Join Workspace</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Joining{" "}
          <span className="font-mono text-[rgb(var(--foreground))]">
            /join/{slug ?? "unknown"}
          </span>
        </p>
        <p className="text-xs text-[rgb(var(--muted))]">
          Sign in first from Sync Hub to join a remote workspace.
        </p>

        <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
          <Input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="One-time invite code"
          />
          <Button type="submit" className="w-full" disabled={isJoining}>
            {isJoining ? "Joining..." : "Join Workspace"}
          </Button>
        </form>
      </section>
    </main>
  )
}
