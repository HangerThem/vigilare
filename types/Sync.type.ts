export type WorkspaceRole = "admin" | "editor" | "viewer"
export type SyncAuthMethod = "passkey" | "credentials"

export type SyncState =
  | "local"
  | "connecting"
  | "synced"
  | "offline"
  | "error"

export interface SyncStatus {
  state: SyncState
  lastSyncedAt: string | null
  pendingLocalChanges: number
  errorMessage: string | null
}

export interface SyncAccount {
  userId: string
  displayName: string
  email?: string | null
  authMethods: SyncAuthMethod[]
}

export interface WorkspaceSummary {
  workspaceId: string
  slug: string
  displayName: string
  role: WorkspaceRole
  createdAt: string
  lastOpenedAt: string | null
}

export interface WorkspaceInstance {
  instanceId: string
  kind: "local" | "remote"
  workspaceId?: string
  label: string
  isActive: boolean
}

export interface WorkspaceMember {
  memberId: string
  userId: string
  displayName: string
  role: WorkspaceRole
  canInvite: boolean
  joinedAt: string
}

export interface InviteSummary {
  inviteId: string
  slug: string
  role: WorkspaceRole
  expiresAt: string
  maxUses: number
  useCount: number
  revokedAt: string | null
}

export interface WorkspaceConnection {
  workspaceId: string
  slug: string
  role: WorkspaceRole
  displayName: string
  revision: number
  createdAt: string
  updatedAt: string
}

export interface WorkspaceCollections {
  links: import("@/types/Link.type").Link[]
  notes: import("@/types/Note.type").Note[]
  snippets: import("@/types/Snippet.type").Snippet[]
  statuses: import("@/types/Status.type").Status[]
}
