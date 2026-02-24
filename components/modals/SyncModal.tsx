"use client"

import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { useModal } from "@/context/ModalContext"
import { useSync } from "@/context/SyncContext"
import { useToast } from "@/context/ToastContext"
import { cn } from "@/utils/cn"
import { SYNC_STATUS_META } from "@/utils/sync/statusMeta"
import { InviteSummary, WorkspaceRole } from "@/types/Sync.type"
import { Copy, Link2, RefreshCcw, RotateCcw, Shield, Users } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

function getInviteState(invite: InviteSummary): {
  label: string
  invalid: boolean
} {
  if (invite.revokedAt) {
    return { label: "Revoked", invalid: true }
  }

  if (new Date(invite.expiresAt).getTime() <= Date.now()) {
    return { label: "Expired", invalid: true }
  }

  if (invite.useCount >= invite.maxUses) {
    return { label: "Used", invalid: true }
  }

  return { label: "Active", invalid: false }
}

export default function SyncModal() {
  const { isModalOpen, openModal } = useModal()
  const sync = useSync()
  const { activeInstanceId, isRemoteActive, listInvites, listMembers } = sync
  const { addToast } = useToast()

  const [workspaceNameInput, setWorkspaceNameInput] = useState("")
  const [joinSlugInput, setJoinSlugInput] = useState("")
  const [joinCodeInput, setJoinCodeInput] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">(
    "editor",
  )
  const [inviteExpiryHours, setInviteExpiryHours] = useState(24)
  const [inviteMaxUses, setInviteMaxUses] = useState(1)
  const [invites, setInvites] = useState<InviteSummary[]>([])
  const [members, setMembers] = useState<
    Awaited<ReturnType<typeof sync.listMembers>>
  >([])
  const [isSyncBusy, setIsSyncBusy] = useState(false)
  const [isJoiningWorkspace, setIsJoiningWorkspace] = useState(false)
  const [showInactiveInvites, setShowInactiveInvites] = useState(false)

  const syncStatusMeta = SYNC_STATUS_META[sync.syncStatus.state]
  const activeWorkspaceId = sync.connection?.workspaceId ?? null
  const isSyncHubOpen = isModalOpen("syncHub")
  const canManageWorkspace = sync.connection?.role === "admin"
  const canCreateOwnedWorkspaces = sync.isAuthenticated

  const refreshSyncDetails = useCallback(async () => {
    if (!isRemoteActive || !activeWorkspaceId) {
      setInvites([])
      setMembers([])
      return
    }

    setIsSyncBusy(true)

    const [inviteResult, memberResult] = await Promise.allSettled([
      listInvites(),
      listMembers(),
    ])

    setInvites(inviteResult.status === "fulfilled" ? inviteResult.value : [])
    setMembers(memberResult.status === "fulfilled" ? memberResult.value : [])
    setIsSyncBusy(false)
  }, [activeWorkspaceId, isRemoteActive, listInvites, listMembers])

  useEffect(() => {
    if (!isSyncHubOpen) return
    void refreshSyncDetails()
  }, [activeInstanceId, isSyncHubOpen, refreshSyncDetails])

  const copyText = useCallback(
    async (text: string, successMessage: string) => {
      if (!navigator?.clipboard) {
        addToast({ message: "Clipboard API unavailable", icon: RotateCcw })
        return
      }

      try {
        await navigator.clipboard.writeText(text)
        addToast({ message: successMessage, icon: Copy })
      } catch (error) {
        addToast({
          message: error instanceof Error ? error.message : "Copy failed",
          icon: RotateCcw,
        })
      }
    },
    [addToast],
  )

  const handleCreateWorkspace = useCallback(async () => {
    try {
      await sync.createWorkspace(workspaceNameInput.trim() || undefined)
      setWorkspaceNameInput("")
      await refreshSyncDetails()
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : "Failed to create workspace",
        icon: RotateCcw,
      })
    }
  }, [addToast, refreshSyncDetails, sync, workspaceNameInput])

  const handleJoinWorkspace = useCallback(async () => {
    if (isJoiningWorkspace) {
      return
    }

    if (!joinSlugInput.trim() || !joinCodeInput.trim()) {
      addToast({
        message: "Join URL/slug and one-time code are required",
        icon: RotateCcw,
      })
      return
    }

    try {
      setIsJoiningWorkspace(true)
      await sync.joinWorkspace(joinSlugInput.trim(), joinCodeInput.trim())
      setJoinSlugInput("")
      setJoinCodeInput("")
      await refreshSyncDetails()
    } catch (error) {
      addToast({
        message:
          error instanceof Error ? error.message : "Failed to join workspace",
        icon: RotateCcw,
      })
    } finally {
      setIsJoiningWorkspace(false)
    }
  }, [
    addToast,
    isJoiningWorkspace,
    joinCodeInput,
    joinSlugInput,
    refreshSyncDetails,
    sync,
  ])

  const handleCopyInvite = useCallback(
    async (role: Extract<WorkspaceRole, "admin" | "editor" | "viewer">) => {
      try {
        const created = await sync.createInvite(
          role,
          inviteExpiryHours,
          inviteMaxUses,
        )
        await copyText(
          `${created.url}\nCode: ${created.code}`,
          `${role} invite copied`,
        )
        await refreshSyncDetails()
      } catch (error) {
        addToast({
          message:
            error instanceof Error ? error.message : "Failed to create invite",
          icon: RotateCcw,
        })
      }
    },
    [
      addToast,
      copyText,
      inviteExpiryHours,
      inviteMaxUses,
      refreshSyncDetails,
      sync,
    ],
  )

  const activeInstanceDescription = useMemo(() => {
    if (sync.activeInstance.kind === "local") {
      return "Local-only instance"
    }

    return `${sync.connection?.role ?? "viewer"} workspace`
  }, [sync.activeInstance.kind, sync.connection?.role])

  const activeInvites = useMemo(
    () => invites.filter((invite) => !getInviteState(invite).invalid),
    [invites],
  )
  const inactiveInvites = useMemo(
    () => invites.filter((invite) => getInviteState(invite).invalid),
    [invites],
  )

  return (
    <Modal name="syncHub">
      <div className="w-full sm:w-[42rem] md:w-[52rem] lg:w-[60rem]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Sync Hub</h2>
            <p className="text-xs sm:text-sm text-[rgb(var(--muted))]">
              Account-based remote workspaces with invite-based sharing.
            </p>
          </div>
          <Button variant="secondary" onClick={() => openModal("settings")}>
            Settings
          </Button>
        </div>

        {!sync.syncEnabled ? (
          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted-background))] p-4 text-sm text-[rgb(var(--muted))]">
            Sync is disabled. Set
            <span className="mx-1 font-mono text-[rgb(var(--foreground))]">
              NEXT_PUBLIC_SYNC_ENABLED=true
            </span>
            and configure server sync environment variables (including
            DATABASE_URL).
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--muted-background))] p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">Sync status</div>
                  <div className="text-xs text-[rgb(var(--muted))]">
                    Active: {sync.activeInstance.label} (
                    {activeInstanceDescription})
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs",
                    syncStatusMeta.className,
                  )}
                >
                  <syncStatusMeta.icon size={12} />
                  {syncStatusMeta.label}
                </span>
              </div>
              {sync.syncStatus.errorMessage && (
                <div className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs sm:text-sm text-red-200">
                  {sync.syncStatus.errorMessage}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[rgb(var(--border))] p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Shield size={14} />
                  Identity
                </div>
                {sync.isAuthenticated ? (
                  <>
                    <div className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                      <div>
                        Account:{" "}
                        <span className="font-medium text-[rgb(var(--foreground))]">
                          {sync.account?.displayName}
                        </span>
                      </div>
                      <div className="mt-1">
                        Active auth methods:{" "}
                        <span className="font-medium text-[rgb(var(--foreground))]">
                          {(sync.account?.authMethods ?? []).join(", ") ||
                            "none"}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => openModal("auth")}
                    >
                      Open Auth
                    </Button>
                    <Button
                      className="w-full"
                      variant="danger"
                      onClick={() => void sync.logout()}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                      You are signed out.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                  </>
                )}
              </div>

              <div className="rounded-xl border border-[rgb(var(--border))] p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users size={14} />
                  Instances
                </div>
                <Select
                  value={sync.activeInstanceId}
                  onChange={(value) => {
                    sync.switchInstance(value as string)
                    void refreshSyncDetails()
                  }}
                  options={sync.instances.map((instance) => ({
                    value: instance.instanceId,
                    label: instance.label,
                    description: instance.kind === "local" ? "Local" : "Remote",
                  }))}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    type="text"
                    value={workspaceNameInput}
                    onChange={(event) =>
                      setWorkspaceNameInput(event.target.value)
                    }
                    placeholder="New workspace name"
                    disabled={!canCreateOwnedWorkspaces}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => void handleCreateWorkspace()}
                    disabled={!canCreateOwnedWorkspaces}
                  >
                    Create Workspace
                  </Button>
                </div>
                {!canCreateOwnedWorkspaces && (
                  <div className="text-xs text-[rgb(var(--muted))]">
                    Sign in to create remote workspaces.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[rgb(var(--border))] p-3 sm:p-4 space-y-3">
              <div className="text-sm font-medium">Join Workspace</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={joinSlugInput}
                  onChange={(event) => setJoinSlugInput(event.target.value)}
                  placeholder="Join URL or slug"
                />
                <Input
                  type="text"
                  value={joinCodeInput}
                  onChange={(event) => setJoinCodeInput(event.target.value)}
                  placeholder="One-time code"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={isJoiningWorkspace}
                  onClick={() => void handleJoinWorkspace()}
                >
                  {isJoiningWorkspace ? "Joining..." : "Join Workspace"}
                </Button>
                <div className="text-xs text-[rgb(var(--muted))] self-center">
                  Joining remote workspaces requires sign-in.
                </div>
              </div>
            </div>

            {sync.isRemoteActive && sync.connection && (
              <div className="rounded-xl border border-[rgb(var(--border))] p-3 sm:p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">
                    Workspace · {sync.connection.displayName}
                  </div>
                  <div className="text-xs text-[rgb(var(--muted))] capitalize">
                    Role: {sync.connection.role}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button variant="danger" onClick={sync.leaveWorkspace}>
                    Leave Remote Instance
                  </Button>
                </div>

                {sync.isReadOnly && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs sm:text-sm text-amber-200">
                    This workspace is read-only.
                  </div>
                )}

                {canManageWorkspace && (
                  <div className="rounded-lg border border-[rgb(var(--border))] p-3 space-y-3">
                    <div className="text-sm font-medium">Invite Management</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Select
                        value={inviteRole}
                        onChange={(value) =>
                          setInviteRole(value as "admin" | "editor" | "viewer")
                        }
                        options={[
                          { value: "admin", label: "Admin" },
                          { value: "editor", label: "Editor" },
                          { value: "viewer", label: "Viewer" },
                        ]}
                      />
                      <Input
                        type="number"
                        min={1}
                        max={336}
                        value={inviteExpiryHours}
                        onChange={(event) =>
                          setInviteExpiryHours(Number(event.target.value) || 24)
                        }
                      />
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={inviteMaxUses}
                        onChange={(event) =>
                          setInviteMaxUses(Number(event.target.value) || 1)
                        }
                      />
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => void handleCopyInvite(inviteRole)}
                    >
                      <Link2 size={14} />
                      Create and Copy Invite
                    </Button>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-[rgb(var(--muted))]">
                        Connections and permissions
                      </div>
                      <Button
                        variant="ghost"
                        className="text-xs"
                        onClick={() => void refreshSyncDetails()}
                      >
                        <RefreshCcw size={14} />
                        Refresh
                      </Button>
                    </div>

                    {isSyncBusy && (
                      <div className="text-xs text-[rgb(var(--muted))]">
                        Loading workspace administration data...
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="text-xs text-[rgb(var(--muted))]">
                        Invites
                      </div>
                      {activeInvites.length === 0 && (
                        <div className="text-xs text-[rgb(var(--muted))]">
                          No active invites.
                        </div>
                      )}
                      {activeInvites.map((invite) => (
                        <div
                          key={invite.inviteId}
                          className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs flex items-center gap-2"
                        >
                          <div className="flex-1">
                            <div className="font-medium capitalize">
                              {invite.role}
                            </div>
                            <div className="text-[rgb(var(--muted))]">
                              /join/{invite.slug} · {invite.useCount}/
                              {invite.maxUses} · Active
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            className="text-xs"
                            onClick={() =>
                              void copyText(
                                `${window.location.origin}/join/${invite.slug}`,
                                "Invite URL copied",
                              )
                            }
                          >
                            Copy URL
                          </Button>
                          {!invite.revokedAt && (
                            <Button
                              variant="ghost"
                              className="text-xs text-red-300"
                              onClick={async () => {
                                await sync.revokeInvite(invite.inviteId)
                                await refreshSyncDetails()
                              }}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}

                      {inactiveInvites.length > 0 && (
                        <div className="pt-1">
                          <Button
                            variant="ghost"
                            className="text-xs"
                            onClick={() =>
                              setShowInactiveInvites((previous) => !previous)
                            }
                          >
                            {showInactiveInvites ? "Hide" : `Show`} inactive
                            invites ({inactiveInvites.length})
                          </Button>
                        </div>
                      )}

                      {showInactiveInvites &&
                        inactiveInvites.map((invite) => {
                          const state = getInviteState(invite)
                          return (
                            <div
                              key={invite.inviteId}
                              className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs flex items-center gap-2 opacity-80"
                            >
                              <div className="flex-1">
                                <div className="font-medium capitalize">
                                  {invite.role}
                                </div>
                                <div className="text-[rgb(var(--muted))]">
                                  Link disabled · {state.label}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-[rgb(var(--muted))]">
                        Members
                      </div>
                      {members.length === 0 && (
                        <div className="text-xs text-[rgb(var(--muted))]">
                          No members found.
                        </div>
                      )}
                      {members.map((member) => (
                        <div
                          key={member.memberId}
                          className="rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs flex items-center gap-2"
                        >
                          <div className="flex-1">
                            <div className="font-medium">
                              {member.displayName}
                            </div>
                            <div className="text-[rgb(var(--muted))] capitalize">
                              {member.role}
                            </div>
                          </div>
                          <Select
                            className="w-28"
                            value={member.role}
                            disabled={sync.account?.userId === member.userId}
                            onChange={async (value) => {
                              await sync.updateMemberRole(
                                member.memberId,
                                value as WorkspaceRole,
                              )
                              await refreshSyncDetails()
                            }}
                            options={[
                              { value: "admin", label: "Admin" },
                              { value: "editor", label: "Editor" },
                              { value: "viewer", label: "Viewer" },
                            ]}
                          />
                          {sync.account?.userId !== member.userId && (
                            <Button
                              variant="ghost"
                              className="text-xs text-red-300"
                              onClick={async () => {
                                await sync.removeMember(member.memberId)
                                await refreshSyncDetails()
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
