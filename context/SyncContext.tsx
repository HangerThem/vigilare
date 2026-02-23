"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { signIn as credentialsSignIn, signOut as authSignOut } from "next-auth/react"
import { signIn as webAuthnSignIn } from "next-auth/webauthn"
import {
  InviteSummary,
  SyncAccount,
  SyncStatus,
  WorkspaceCollections,
  WorkspaceConnection,
  WorkspaceInstance,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSummary,
} from "@/types/Sync.type"
import { useLocalStorageState } from "@/hook/useLocalStorageState"
import { useToast } from "@/context/ToastContext"
import { icons } from "lucide-react"
import {
  confirmCredentialsReset,
  consumeWorkspaceInvite,
  createWorkspace,
  createWorkspaceInvite,
  fetchAuthMe,
  getWorkspaceCollections,
  listWorkspaceInvites,
  listWorkspaceMembers,
  listWorkspaces,
  putWorkspaceCollection,
  registerWithCredentials,
  removeWorkspaceMember,
  requestCredentialsReset,
  revokeWorkspaceInvite,
  updateWorkspaceMember,
} from "@/utils/sync/client"
import {
  readSyncDataFromLocalStorage,
  SyncCollectionKey,
  SyncDataCollections,
} from "@/utils/sync/mappers"

const ACCOUNT_STORAGE_KEY = "syncV4Account"
const INSTANCES_STORAGE_KEY = "syncV4Instances"
const ACTIVE_INSTANCE_STORAGE_KEY = "syncV4ActiveInstanceId"
const CONNECTIONS_STORAGE_KEY = "syncV4Connections"

const LOCAL_INSTANCE_ID = "local"
const SYNC_POLL_INTERVAL_MS = 8000
const PASSKEY_EMAIL_DOMAIN = "auth.vigilare.local"

const DEFAULT_SYNC_STATUS: SyncStatus = {
  state: "local",
  lastSyncedAt: null,
  pendingLocalChanges: 0,
  errorMessage: null,
}

const EMPTY_COLLECTIONS: WorkspaceCollections = {
  links: [],
  notes: [],
  snippets: [],
  statuses: [],
}

const DEFAULT_INSTANCES: WorkspaceInstance[] = [
  {
    instanceId: LOCAL_INSTANCE_ID,
    kind: "local",
    label: "Local",
    isActive: true,
  },
]

function createLocalInstance(isActive: boolean): WorkspaceInstance {
  return {
    instanceId: LOCAL_INSTANCE_ID,
    kind: "local",
    label: "Local",
    isActive,
  }
}

function isOnline(): boolean {
  if (typeof navigator === "undefined") return true
  return navigator.onLine
}

function parseJoinSlug(inviteUrlOrSlug: string): string {
  const trimmed = inviteUrlOrSlug.trim()
  if (!trimmed) {
    throw new Error("Join URL or slug is required")
  }

  if (/^[a-z0-9_-]{4,60}$/i.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error("Invite URL is invalid")
  }

  const segments = parsed.pathname.split("/").filter(Boolean)
  const joinIndex = segments.findIndex((segment) => segment === "join")

  if (joinIndex >= 0 && segments[joinIndex + 1]) {
    return segments[joinIndex + 1].toLowerCase()
  }

  if (segments.length > 0) {
    return segments[segments.length - 1].toLowerCase()
  }

  throw new Error("Invite URL is missing slug")
}

function normalizeInstances(
  instances: WorkspaceInstance[],
  activeInstanceId: string,
): WorkspaceInstance[] {
  const deduped = new Map<string, WorkspaceInstance>()

  for (const instance of instances) {
    if (!instance.instanceId) continue

    if (instance.kind === "remote" && !instance.workspaceId) {
      continue
    }

    deduped.set(instance.instanceId, {
      ...instance,
      isActive: instance.instanceId === activeInstanceId,
    })
  }

  if (!deduped.has(LOCAL_INSTANCE_ID)) {
    deduped.set(LOCAL_INSTANCE_ID, createLocalInstance(activeInstanceId === LOCAL_INSTANCE_ID))
  }

  return Array.from(deduped.values())
}

function toConnection(workspace: WorkspaceSummary, revision = 0): WorkspaceConnection {
  const now = new Date().toISOString()
  return {
    workspaceId: workspace.workspaceId,
    slug: workspace.slug,
    role: workspace.role,
    displayName: workspace.displayName,
    revision,
    createdAt: now,
    updatedAt: now,
  }
}

function buildHiddenPasskeyEmail(): string {
  return `passkey+${crypto.randomUUID()}@${PASSKEY_EMAIL_DOMAIN}`
}

export interface SyncContextType {
  syncEnabled: boolean
  isAuthenticated: boolean
  isPersistentIdentity: boolean
  isConnected: boolean
  isRemoteActive: boolean
  isReadOnly: boolean
  account: SyncAccount | null
  instances: WorkspaceInstance[]
  activeInstanceId: string
  activeInstance: WorkspaceInstance
  workspaces: WorkspaceSummary[]
  connection: WorkspaceConnection | null
  syncStatus: SyncStatus
  registerWithPasskey: (displayName: string) => Promise<void>
  loginWithPasskey: () => Promise<void>
  registerWithCredentials: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>
  loginWithCredentials: (email: string, password: string) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (email: string, token: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
  switchInstance: (instanceId: string) => void
  listWorkspaces: () => Promise<WorkspaceSummary[]>
  createWorkspace: (displayName?: string) => Promise<void>
  createWorkspaceFromLocal: () => Promise<void>
  joinWorkspace: (inviteUrl: string, code?: string) => Promise<void>
  joinWorkspaceWithCode: (slug: string, code: string) => Promise<void>
  leaveWorkspace: () => void
  createInvite: (
    role: Extract<WorkspaceRole, "admin" | "editor" | "viewer">,
    expiresInHours: number,
    maxUses?: number,
  ) => Promise<{ invite: InviteSummary; url: string; code: string }>
  listInvites: () => Promise<InviteSummary[]>
  revokeInvite: (inviteId: string) => Promise<void>
  listMembers: () => Promise<WorkspaceMember[]>
  updateMemberRole: (
    memberId: string,
    role: WorkspaceRole,
    canInvite?: boolean,
  ) => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  getCollection: <K extends SyncCollectionKey>(
    key: K,
  ) => SyncDataCollections[K]
  updateCollection: <K extends SyncCollectionKey>(
    key: K,
    updater: (prev: SyncDataCollections[K]) => SyncDataCollections[K],
  ) => boolean
}

const SyncContext = createContext<SyncContextType | null>(null)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast()
  const syncEnabled = process.env.NEXT_PUBLIC_SYNC_ENABLED === "true"

  const { value: storedAccount, setValue: setStoredAccount } =
    useLocalStorageState<SyncAccount | null>(ACCOUNT_STORAGE_KEY, null)
  const { value: storedInstances, setValue: setStoredInstances } =
    useLocalStorageState<WorkspaceInstance[]>(INSTANCES_STORAGE_KEY, DEFAULT_INSTANCES)
  const { value: storedActiveInstanceId, setValue: setStoredActiveInstanceId } =
    useLocalStorageState<string>(ACTIVE_INSTANCE_STORAGE_KEY, LOCAL_INSTANCE_ID)
  const { value: storedConnections, setValue: setStoredConnections } =
    useLocalStorageState<Record<string, WorkspaceConnection>>(CONNECTIONS_STORAGE_KEY, {})

  const [account, setAccount] = useState<SyncAccount | null>(storedAccount)
  const [instances, setInstances] = useState<WorkspaceInstance[]>(() =>
    normalizeInstances(storedInstances, storedActiveInstanceId),
  )
  const [activeInstanceId, setActiveInstanceId] = useState<string>(storedActiveInstanceId)
  const [connections, setConnections] = useState<Record<string, WorkspaceConnection>>(storedConnections)
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(DEFAULT_SYNC_STATUS)
  const [collectionsByWorkspace, setCollectionsByWorkspace] = useState<Record<string, WorkspaceCollections>>({})

  const accountRef = useRef<SyncAccount | null>(account)
  const activeInstanceIdRef = useRef<string>(activeInstanceId)
  const connectionsRef = useRef<Record<string, WorkspaceConnection>>(connections)
  const collectionsRef = useRef<Record<string, WorkspaceCollections>>(collectionsByWorkspace)
  const writeQueueRef = useRef<Record<string, Promise<void>>>({})

  useEffect(() => {
    accountRef.current = account
  }, [account])

  useEffect(() => {
    activeInstanceIdRef.current = activeInstanceId
  }, [activeInstanceId])

  useEffect(() => {
    connectionsRef.current = connections
  }, [connections])

  useEffect(() => {
    collectionsRef.current = collectionsByWorkspace
  }, [collectionsByWorkspace])

  const persistAccount = useCallback(
    (next: SyncAccount | null) => {
      accountRef.current = next
      setAccount(next)
      setStoredAccount(next)
    },
    [setStoredAccount],
  )

  const persistInstances = useCallback(
    (nextInstances: WorkspaceInstance[], nextActiveInstanceId: string) => {
      const normalized = normalizeInstances(nextInstances, nextActiveInstanceId)
      activeInstanceIdRef.current = nextActiveInstanceId
      setActiveInstanceId(nextActiveInstanceId)
      setInstances(normalized)
      setStoredInstances(normalized)
      setStoredActiveInstanceId(nextActiveInstanceId)
    },
    [setStoredActiveInstanceId, setStoredInstances],
  )

  const persistConnections = useCallback(
    (next: Record<string, WorkspaceConnection>) => {
      connectionsRef.current = next
      setConnections(next)
      setStoredConnections(next)
    },
    [setStoredConnections],
  )

  const setStatus = useCallback((partial: Partial<SyncStatus>) => {
    setSyncStatus((prev) => ({ ...prev, ...partial }))
  }, [])

  const activeInstance = useMemo(() => {
    return (
      instances.find((instance) => instance.instanceId === activeInstanceId) ??
      createLocalInstance(true)
    )
  }, [activeInstanceId, instances])

  const activeWorkspaceId =
    activeInstance.kind === "remote" ? activeInstance.workspaceId ?? null : null

  const connection = activeWorkspaceId ? connections[activeWorkspaceId] ?? null : null

  const refreshWorkspaces = useCallback(async (): Promise<WorkspaceSummary[]> => {
    if (!syncEnabled || !accountRef.current) {
      setWorkspaces([])
      return []
    }

    const response = await listWorkspaces()
    setWorkspaces(response.workspaces)

    const nextInstances = normalizeInstances(
      [
        createLocalInstance(activeInstanceIdRef.current === LOCAL_INSTANCE_ID),
        ...response.workspaces.map((workspace) => ({
          instanceId: `ws_${workspace.workspaceId}`,
          kind: "remote" as const,
          workspaceId: workspace.workspaceId,
          label: workspace.displayName,
          isActive: activeInstanceIdRef.current === `ws_${workspace.workspaceId}`,
        })),
      ],
      activeInstanceIdRef.current,
    )

    const nextConnections: Record<string, WorkspaceConnection> = {
      ...connectionsRef.current,
    }

    const allowedWorkspaceIds = new Set(response.workspaces.map((workspace) => workspace.workspaceId))

    for (const workspace of response.workspaces) {
      const existing = nextConnections[workspace.workspaceId]
      nextConnections[workspace.workspaceId] = {
        ...(existing ?? toConnection(workspace)),
        workspaceId: workspace.workspaceId,
        slug: workspace.slug,
        role: workspace.role,
        displayName: workspace.displayName,
        updatedAt: new Date().toISOString(),
      }
    }

    for (const workspaceId of Object.keys(nextConnections)) {
      if (!allowedWorkspaceIds.has(workspaceId)) {
        delete nextConnections[workspaceId]
      }
    }

    persistConnections(nextConnections)

    const activeExists = nextInstances.some((instance) => instance.instanceId === activeInstanceIdRef.current)
    persistInstances(nextInstances, activeExists ? activeInstanceIdRef.current : LOCAL_INSTANCE_ID)

    return response.workspaces
  }, [persistConnections, persistInstances, syncEnabled])

  const hydrateAccount = useCallback(async () => {
    if (!syncEnabled) {
      persistAccount(null)
      setWorkspaces([])
      return
    }

    try {
      const response = await fetchAuthMe()
      persistAccount(response.account)
      await refreshWorkspaces()
    } catch {
      persistAccount(null)
      setWorkspaces([])
      persistInstances(DEFAULT_INSTANCES, LOCAL_INSTANCE_ID)
      persistConnections({})
      setCollectionsByWorkspace({})
    }
  }, [persistAccount, persistConnections, persistInstances, refreshWorkspaces, syncEnabled])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void hydrateAccount()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [hydrateAccount])

  const switchInstance = useCallback(
    (instanceId: string) => {
      const target = instances.find((instance) => instance.instanceId === instanceId)
      if (!target) {
        return
      }

      persistInstances(instances, instanceId)

      if (target.kind === "local") {
        setStatus({
          state: "local",
          pendingLocalChanges: 0,
          errorMessage: null,
        })
      } else {
        setStatus({
          state: isOnline() ? "connecting" : "offline",
          errorMessage: null,
        })
      }
    },
    [instances, persistInstances, setStatus],
  )

  const leaveWorkspace = useCallback(() => {
    switchInstance(LOCAL_INSTANCE_ID)
  }, [switchInstance])

  const ensureWorkspaceSnapshot = useCallback(
    async (workspaceId: string, force = false) => {
      const currentConnection = connectionsRef.current[workspaceId]
      if (!currentConnection) {
        throw new Error("Workspace connection is unavailable")
      }

      if (!force && collectionsRef.current[workspaceId]) {
        return
      }

      const snapshot = await getWorkspaceCollections({ workspaceId })
      if (snapshot.unchanged) {
        return
      }

      setCollectionsByWorkspace((prev) => ({
        ...prev,
        [workspaceId]: {
          links: snapshot.links ?? [],
          notes: snapshot.notes ?? [],
          snippets: snapshot.snippets ?? [],
          statuses: snapshot.statuses ?? [],
        },
      }))

      persistConnections({
        ...connectionsRef.current,
        [workspaceId]: {
          ...currentConnection,
          revision: snapshot.revision,
          updatedAt: new Date().toISOString(),
        },
      })

      setStatus({
        state: "synced",
        lastSyncedAt: new Date().toISOString(),
        errorMessage: null,
      })
    },
    [persistConnections, setStatus],
  )

  const registerWithPasskey = useCallback(
    async (displayName: string) => {
      if (!syncEnabled) {
        throw new Error("Sync is disabled")
      }

      const currentAccount = accountRef.current
      const email = currentAccount?.email ?? buildHiddenPasskeyEmail()
      const name = displayName.trim() || currentAccount?.displayName || "Vigilare User"

      const result = await webAuthnSignIn("passkey", {
        redirect: false,
        action: "register",
        email,
        name,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      await hydrateAccount()

      addToast({
        message: currentAccount ? "Passkey linked" : "Passkey account created",
        icon: icons.Check,
      })
    },
    [addToast, hydrateAccount, syncEnabled],
  )

  const loginWithPasskey = useCallback(async () => {
    if (!syncEnabled) {
      throw new Error("Sync is disabled")
    }

    const result = await webAuthnSignIn("passkey", {
      redirect: false,
      action: "authenticate",
    })

    if (result?.error) {
      throw new Error(result.error)
    }

    await hydrateAccount()

    addToast({
      message: "Signed in with passkey",
      icon: icons.Check,
    })
  }, [addToast, hydrateAccount, syncEnabled])

  const registerWithCredentialsHandler = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!syncEnabled) {
        throw new Error("Sync is disabled")
      }

      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail || !password.trim()) {
        throw new Error("Email and password are required")
      }

      await registerWithCredentials({
        displayName: displayName.trim() || "Vigilare User",
        email: normalizedEmail,
        password,
      })

      const signInResult = await credentialsSignIn("credentials", {
        redirect: false,
        email: normalizedEmail,
        password,
      })

      if (signInResult?.error) {
        throw new Error(signInResult.error)
      }

      await hydrateAccount()

      addToast({
        message: "Credentials account ready",
        icon: icons.Check,
      })
    },
    [addToast, hydrateAccount, syncEnabled],
  )

  const loginWithCredentials = useCallback(
    async (email: string, password: string) => {
      if (!syncEnabled) {
        throw new Error("Sync is disabled")
      }

      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail || !password.trim()) {
        throw new Error("Email and password are required")
      }

      const signInResult = await credentialsSignIn("credentials", {
        redirect: false,
        email: normalizedEmail,
        password,
      })

      if (signInResult?.error) {
        throw new Error(signInResult.error)
      }

      await hydrateAccount()

      addToast({
        message: "Signed in with credentials",
        icon: icons.Check,
      })
    },
    [addToast, hydrateAccount, syncEnabled],
  )

  const requestPasswordResetHandler = useCallback(
    async (email: string) => {
      if (!syncEnabled) {
        throw new Error("Sync is disabled")
      }

      await requestCredentialsReset({
        email: email.trim().toLowerCase(),
      })

      addToast({
        message: "Password reset email sent if the account exists",
        icon: icons.Mail,
      })
    },
    [addToast, syncEnabled],
  )

  const confirmPasswordResetHandler = useCallback(
    async (email: string, token: string, newPassword: string) => {
      if (!syncEnabled) {
        throw new Error("Sync is disabled")
      }

      await confirmCredentialsReset({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        newPassword,
      })

      addToast({
        message: "Password updated",
        icon: icons.Check,
      })
    },
    [addToast, syncEnabled],
  )

  const logout = useCallback(async () => {
    await authSignOut({ redirect: false })
    persistAccount(null)
    persistInstances(DEFAULT_INSTANCES, LOCAL_INSTANCE_ID)
    persistConnections({})
    setCollectionsByWorkspace({})
    setWorkspaces([])

    setStatus({
      state: "local",
      errorMessage: null,
      pendingLocalChanges: 0,
    })

    addToast({
      message: "Signed out",
      icon: icons.Info,
    })
  }, [addToast, persistAccount, persistConnections, persistInstances, setStatus])

  const createWorkspaceHandler = useCallback(
    async (displayName?: string) => {
      const currentAccount = accountRef.current
      if (!syncEnabled || !currentAccount) {
        throw new Error("Sign in to create a synced workspace")
      }

      const localCollections = readSyncDataFromLocalStorage()
      setStatus({ state: "connecting", errorMessage: null })

      const created = await createWorkspace({
        displayName: displayName?.trim() || "Untitled Workspace",
        collections: localCollections,
      })

      const workspaceConnection = toConnection(created.workspace, 0)
      const nextConnections = {
        ...connectionsRef.current,
        [created.workspace.workspaceId]: workspaceConnection,
      }
      persistConnections(nextConnections)

      setCollectionsByWorkspace((prev) => ({
        ...prev,
        [created.workspace.workspaceId]: localCollections,
      }))

      await refreshWorkspaces()

      const nextInstances = [
        ...instances.filter((instance) => instance.instanceId !== `ws_${created.workspace.workspaceId}`),
        {
          instanceId: `ws_${created.workspace.workspaceId}`,
          kind: "remote" as const,
          workspaceId: created.workspace.workspaceId,
          label: created.workspace.displayName,
          isActive: false,
        },
      ]

      persistInstances(nextInstances, `ws_${created.workspace.workspaceId}`)

      setStatus({
        state: "synced",
        pendingLocalChanges: 0,
        lastSyncedAt: new Date().toISOString(),
        errorMessage: null,
      })

      addToast({
        message: "Workspace created",
        icon: icons.Check,
      })
    },
    [
      addToast,
      instances,
      persistConnections,
      persistInstances,
      refreshWorkspaces,
      setStatus,
      syncEnabled,
    ],
  )

  const joinWorkspaceWithCode = useCallback(
    async (slug: string, code: string) => {
      if (!syncEnabled) {
        throw new Error("Sync is disabled")
      }

      const currentAccount = accountRef.current
      if (!currentAccount) {
        throw new Error("Sign in to join a workspace")
      }

      const normalizedSlug = parseJoinSlug(slug)
      const normalizedCode = code.trim()
      if (!normalizedCode) {
        throw new Error("Invite code is required")
      }

      setStatus({ state: "connecting", errorMessage: null })

      const consumed = await consumeWorkspaceInvite({
        slug: normalizedSlug,
        code: normalizedCode,
      })

      const nextConnection = toConnection(consumed.workspace, 0)
      persistConnections({
        ...connectionsRef.current,
        [consumed.workspace.workspaceId]: nextConnection,
      })

      await refreshWorkspaces()
      persistInstances(
        [
          ...instances.filter((instance) => instance.instanceId !== `ws_${consumed.workspace.workspaceId}`),
          {
            instanceId: `ws_${consumed.workspace.workspaceId}`,
            kind: "remote" as const,
            workspaceId: consumed.workspace.workspaceId,
            label: consumed.workspace.displayName,
            isActive: false,
          },
        ],
        `ws_${consumed.workspace.workspaceId}`,
      )

      await ensureWorkspaceSnapshot(consumed.workspace.workspaceId, true)

      setStatus({
        state: "synced",
        pendingLocalChanges: 0,
        lastSyncedAt: new Date().toISOString(),
        errorMessage: null,
      })

      addToast({
        message: "Workspace joined",
        icon: icons.Check,
      })
    },
    [
      addToast,
      ensureWorkspaceSnapshot,
      instances,
      persistConnections,
      persistInstances,
      refreshWorkspaces,
      setStatus,
      syncEnabled,
    ],
  )

  const joinWorkspace = useCallback(
    async (inviteUrl: string, code?: string) => {
      const slug = parseJoinSlug(inviteUrl)
      const inviteCode = code?.trim()
      if (!inviteCode) {
        throw new Error("Invite code is required")
      }

      await joinWorkspaceWithCode(slug, inviteCode)
    },
    [joinWorkspaceWithCode],
  )

  const createInvite = useCallback(
    async (
      role: Extract<WorkspaceRole, "admin" | "editor" | "viewer">,
      expiresInHours: number,
      maxUses = 1,
    ) => {
      if (!syncEnabled || !activeWorkspaceId) {
        throw new Error("Select a remote workspace first")
      }

      return createWorkspaceInvite({
        workspaceId: activeWorkspaceId,
        role,
        expiresInHours,
        maxUses,
      })
    },
    [activeWorkspaceId, syncEnabled],
  )

  const listInvites = useCallback(async (): Promise<InviteSummary[]> => {
    if (!syncEnabled || !activeWorkspaceId) {
      return []
    }

    const response = await listWorkspaceInvites({
      workspaceId: activeWorkspaceId,
    })

    return response.invites
  }, [activeWorkspaceId, syncEnabled])

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      if (!syncEnabled || !activeWorkspaceId) {
        throw new Error("Select a remote workspace first")
      }

      await revokeWorkspaceInvite({
        workspaceId: activeWorkspaceId,
        inviteId,
      })
    },
    [activeWorkspaceId, syncEnabled],
  )

  const listMembers = useCallback(async (): Promise<WorkspaceMember[]> => {
    if (!syncEnabled || !activeWorkspaceId) {
      return []
    }

    const response = await listWorkspaceMembers({
      workspaceId: activeWorkspaceId,
    })

    return response.members
  }, [activeWorkspaceId, syncEnabled])

  const updateMemberRole = useCallback(
    async (memberId: string, role: WorkspaceRole, canInvite?: boolean) => {
      if (!syncEnabled || !activeWorkspaceId) {
        throw new Error("Select a remote workspace first")
      }

      await updateWorkspaceMember({
        workspaceId: activeWorkspaceId,
        memberId,
        role,
        canInvite,
      })
    },
    [activeWorkspaceId, syncEnabled],
  )

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!syncEnabled || !activeWorkspaceId) {
        throw new Error("Select a remote workspace first")
      }

      await removeWorkspaceMember({
        workspaceId: activeWorkspaceId,
        memberId,
      })
    },
    [activeWorkspaceId, syncEnabled],
  )

  const getCollection = useCallback(
    <K extends SyncCollectionKey>(key: K): SyncDataCollections[K] => {
      if (!activeWorkspaceId) {
        return EMPTY_COLLECTIONS[key] as SyncDataCollections[K]
      }

      const collections = collectionsByWorkspace[activeWorkspaceId] ?? EMPTY_COLLECTIONS
      return collections[key] as SyncDataCollections[K]
    },
    [activeWorkspaceId, collectionsByWorkspace],
  )

  const updateCollection = useCallback(
    <K extends SyncCollectionKey>(
      key: K,
      updater: (prev: SyncDataCollections[K]) => SyncDataCollections[K],
    ): boolean => {
      const currentAccount = accountRef.current
      if (!syncEnabled || !activeWorkspaceId || !connection || !currentAccount) {
        return false
      }

      if (connection.role === "viewer") {
        addToast({
          message: "Workspace is read-only",
          icon: icons.Lock,
        })
        return false
      }

      const previousCollections = collectionsRef.current[activeWorkspaceId] ?? EMPTY_COLLECTIONS
      const nextCollection = updater(
        (previousCollections[key] ?? []) as SyncDataCollections[K],
      ) as WorkspaceCollections[K]
      const optimisticCollections: WorkspaceCollections = {
        ...previousCollections,
        [key]: nextCollection,
      }

      setCollectionsByWorkspace((prev) => ({
        ...prev,
        [activeWorkspaceId]: optimisticCollections,
      }))

      setStatus({
        state: isOnline() ? "connecting" : "offline",
        pendingLocalChanges: 1,
      })

      const enqueue = async () => {
        const workspaceId = activeWorkspaceId
        const runUpdate = async (
          baseRevision: number,
          items: WorkspaceCollections[K],
        ): Promise<{ revision: number; collections?: WorkspaceCollections }> => {
          const result = await putWorkspaceCollection({
            workspaceId,
            collection: key,
            baseRevision,
            items,
          })

          if (result.ok) {
            return {
              revision: result.revision,
            }
          }

          const conflictCollections: WorkspaceCollections = {
            links: result.links,
            notes: result.notes,
            snippets: result.snippets,
            statuses: result.statuses,
          }

          return {
            revision: result.revision,
            collections: conflictCollections,
          }
        }

        const currentConnection = connectionsRef.current[workspaceId]
        if (!currentConnection) {
          return
        }

        const firstAttempt = await runUpdate(currentConnection.revision, nextCollection)

        if (!firstAttempt.collections) {
          persistConnections({
            ...connectionsRef.current,
            [workspaceId]: {
              ...connectionsRef.current[workspaceId],
              revision: firstAttempt.revision,
              updatedAt: new Date().toISOString(),
            },
          })

          setStatus({
            state: "synced",
            pendingLocalChanges: 0,
            lastSyncedAt: new Date().toISOString(),
            errorMessage: null,
          })

          return
        }

        setCollectionsByWorkspace((prev) => ({
          ...prev,
          [workspaceId]: firstAttempt.collections!,
        }))

        const retriedCollection = updater(
          (firstAttempt.collections[key] ?? []) as SyncDataCollections[K],
        ) as WorkspaceCollections[K]

        setCollectionsByWorkspace((prev) => ({
          ...prev,
          [workspaceId]: {
            ...firstAttempt.collections!,
            [key]: retriedCollection,
          },
        }))

        const secondAttempt = await runUpdate(firstAttempt.revision, retriedCollection)
        if (!secondAttempt.collections) {
          persistConnections({
            ...connectionsRef.current,
            [workspaceId]: {
              ...connectionsRef.current[workspaceId],
              revision: secondAttempt.revision,
              updatedAt: new Date().toISOString(),
            },
          })

          setStatus({
            state: "synced",
            pendingLocalChanges: 0,
            lastSyncedAt: new Date().toISOString(),
            errorMessage: null,
          })

          return
        }

        setCollectionsByWorkspace((prev) => ({
          ...prev,
          [workspaceId]: secondAttempt.collections!,
        }))

        persistConnections({
          ...connectionsRef.current,
          [workspaceId]: {
            ...connectionsRef.current[workspaceId],
            revision: secondAttempt.revision,
            updatedAt: new Date().toISOString(),
          },
        })

        setStatus({
          state: "error",
          pendingLocalChanges: 0,
          errorMessage: "Could not apply local change due to repeated revision conflicts",
        })
      }

      const queue = writeQueueRef.current[activeWorkspaceId] ?? Promise.resolve()
      writeQueueRef.current[activeWorkspaceId] = queue
        .then(enqueue)
        .catch((error: unknown) => {
          setCollectionsByWorkspace((prev) => ({
            ...prev,
            [activeWorkspaceId]: previousCollections,
          }))

          setStatus({
            state: "error",
            pendingLocalChanges: 0,
            errorMessage: error instanceof Error ? error.message : "Failed to sync updates",
          })
        })

      return true
    },
    [activeWorkspaceId, addToast, connection, persistConnections, setStatus, syncEnabled],
  )

  useEffect(() => {
    if (syncEnabled && activeWorkspaceId && account) {
      return
    }

    if (activeInstance.kind !== "local") {
      return
    }

    const timer = window.setTimeout(() => {
      setStatus({
        state: "local",
        pendingLocalChanges: 0,
        errorMessage: null,
      })
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [account, activeInstance.kind, activeWorkspaceId, setStatus, syncEnabled])

  useEffect(() => {
    if (!syncEnabled || !activeWorkspaceId || !account) {
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        setStatus({
          state: isOnline() ? "connecting" : "offline",
          errorMessage: null,
        })

        await ensureWorkspaceSnapshot(activeWorkspaceId, true)
      } catch (error) {
        if (cancelled) return

        setStatus({
          state: "error",
          errorMessage: error instanceof Error ? error.message : "Failed to load workspace",
        })
      }
    }

    void load()

    const timer = window.setInterval(() => {
      if (cancelled) return
      if (!isOnline()) {
        setStatus({ state: "offline" })
        return
      }

      const currentConnection = connectionsRef.current[activeWorkspaceId]
      if (!currentConnection) {
        return
      }

      void getWorkspaceCollections({
        workspaceId: activeWorkspaceId,
        sinceRevision: currentConnection.revision,
      })
        .then((response) => {
          if (cancelled) return
          if (response.unchanged) {
            return
          }

          setCollectionsByWorkspace((prev) => ({
            ...prev,
            [activeWorkspaceId]: {
              links: response.links ?? [],
              notes: response.notes ?? [],
              snippets: response.snippets ?? [],
              statuses: response.statuses ?? [],
            },
          }))

          persistConnections({
            ...connectionsRef.current,
            [activeWorkspaceId]: {
              ...connectionsRef.current[activeWorkspaceId],
              revision: response.revision,
              updatedAt: new Date().toISOString(),
            },
          })

          setStatus({
            state: "synced",
            lastSyncedAt: new Date().toISOString(),
            errorMessage: null,
          })
        })
        .catch((error: unknown) => {
          if (cancelled) return
          setStatus({
            state: isOnline() ? "error" : "offline",
            errorMessage: error instanceof Error ? error.message : "Failed to refresh workspace",
          })
        })
    }, SYNC_POLL_INTERVAL_MS)

    const onOnline = () => {
      setStatus({ state: "connecting", errorMessage: null })
      void ensureWorkspaceSnapshot(activeWorkspaceId, true)
    }

    const onOffline = () => {
      setStatus({ state: "offline" })
    }

    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [account, activeWorkspaceId, ensureWorkspaceSnapshot, persistConnections, setStatus, syncEnabled])

  const contextValue = useMemo<SyncContextType>(
    () => ({
      syncEnabled,
      isAuthenticated: account !== null,
      isPersistentIdentity: Boolean(account && account.authMethods.length > 0),
      isConnected:
        Boolean(syncEnabled && account && activeWorkspaceId && connection) &&
        Boolean(activeWorkspaceId && collectionsByWorkspace[activeWorkspaceId]),
      isRemoteActive: activeInstance.kind === "remote",
      isReadOnly: activeInstance.kind === "remote" && connection?.role === "viewer",
      account,
      instances,
      activeInstanceId,
      activeInstance,
      workspaces,
      connection,
      syncStatus,
      registerWithPasskey,
      loginWithPasskey,
      registerWithCredentials: registerWithCredentialsHandler,
      loginWithCredentials,
      requestPasswordReset: requestPasswordResetHandler,
      confirmPasswordReset: confirmPasswordResetHandler,
      logout,
      switchInstance,
      listWorkspaces: refreshWorkspaces,
      createWorkspace: createWorkspaceHandler,
      createWorkspaceFromLocal: createWorkspaceHandler,
      joinWorkspace,
      joinWorkspaceWithCode,
      leaveWorkspace,
      createInvite,
      listInvites,
      revokeInvite,
      listMembers,
      updateMemberRole,
      removeMember,
      getCollection,
      updateCollection,
    }),
    [
      account,
      activeInstance,
      activeInstanceId,
      activeWorkspaceId,
      collectionsByWorkspace,
      connection,
      confirmPasswordResetHandler,
      createInvite,
      createWorkspaceHandler,
      getCollection,
      instances,
      joinWorkspace,
      joinWorkspaceWithCode,
      leaveWorkspace,
      listInvites,
      listMembers,
      loginWithCredentials,
      loginWithPasskey,
      logout,
      refreshWorkspaces,
      registerWithCredentialsHandler,
      registerWithPasskey,
      removeMember,
      requestPasswordResetHandler,
      revokeInvite,
      switchInstance,
      syncEnabled,
      syncStatus,
      updateCollection,
      updateMemberRole,
      workspaces,
    ],
  )

  return <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>
}

export function useSync() {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider")
  }

  return context
}
