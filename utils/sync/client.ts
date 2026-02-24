import {
  InviteSummary,
  SyncAccount,
  WorkspaceCollections,
  WorkspaceConnection,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSummary,
} from "@/types/Sync.type"

interface ApiError {
  error: string
}

function getJsonHeaders(extra?: HeadersInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(extra ?? {}),
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  const raw = (await response.json()) as T | ApiError
  if (!response.ok) {
    const error = (raw as ApiError).error || "Request failed"
    throw new Error(error)
  }

  return raw as T
}

export async function fetchAuthMe(): Promise<{ account: SyncAccount }> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })

  return parseJson<{ account: SyncAccount }>(response)
}

export async function registerWithCredentials(payload: {
  displayName: string
  email: string
  password: string
}): Promise<{ account: SyncAccount }> {
  const response = await fetch("/api/auth/credentials/register", {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(payload),
  })

  return parseJson<{ account: SyncAccount }>(response)
}

export async function requestCredentialsReset(payload: {
  email: string
}): Promise<void> {
  const response = await fetch("/api/auth/credentials/reset/request", {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(payload),
  })

  await parseJson<{ ok: true }>(response)
}

export async function confirmCredentialsReset(payload: {
  email: string
  token: string
  newPassword: string
}): Promise<void> {
  const response = await fetch("/api/auth/credentials/reset/confirm", {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(payload),
  })

  await parseJson<{ ok: true }>(response)
}

export async function listWorkspaces(): Promise<{ workspaces: WorkspaceSummary[] }> {
  const response = await fetch("/api/workspaces", {
    method: "GET",
  })

  return parseJson<{ workspaces: WorkspaceSummary[] }>(response)
}

export async function createWorkspace(payload: {
  displayName: string
  collections?: WorkspaceCollections
}): Promise<{ workspace: WorkspaceSummary }> {
  const response = await fetch("/api/workspaces", {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(payload),
  })

  return parseJson<{ workspace: WorkspaceSummary }>(response)
}

export async function consumeWorkspaceInvite(payload: {
  slug: string
  code: string
}): Promise<{ workspace: WorkspaceSummary }> {
  const response = await fetch("/api/workspaces/invites/consume", {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify(payload),
  })

  return parseJson<{ workspace: WorkspaceSummary }>(response)
}

export async function createWorkspaceInvite(payload: {
  workspaceId: string
  role: WorkspaceRole
  expiresInHours: number
  maxUses?: number
}): Promise<{ invite: InviteSummary; url: string; code: string }> {
  const response = await fetch(`/api/workspaces/${payload.workspaceId}/invites`, {
    method: "POST",
    headers: getJsonHeaders(),
    body: JSON.stringify({
      role: payload.role,
      expiresInHours: payload.expiresInHours,
      maxUses: payload.maxUses ?? 1,
    }),
  })

  return parseJson<{ invite: InviteSummary; url: string; code: string }>(response)
}

export async function listWorkspaceInvites(payload: {
  workspaceId: string
}): Promise<{ invites: InviteSummary[] }> {
  const response = await fetch(`/api/workspaces/${payload.workspaceId}/invites`, {
    method: "GET",
  })

  return parseJson<{ invites: InviteSummary[] }>(response)
}

export async function revokeWorkspaceInvite(payload: {
  workspaceId: string
  inviteId: string
}): Promise<void> {
  const response = await fetch(
    `/api/workspaces/${payload.workspaceId}/invites/${payload.inviteId}/revoke`,
    {
      method: "POST",
    },
  )

  await parseJson<{ ok: true }>(response)
}

export async function listWorkspaceMembers(payload: {
  workspaceId: string
}): Promise<{ members: WorkspaceMember[] }> {
  const response = await fetch(`/api/workspaces/${payload.workspaceId}/members`, {
    method: "GET",
  })

  return parseJson<{ members: WorkspaceMember[] }>(response)
}

export async function updateWorkspaceMember(payload: {
  workspaceId: string
  memberId: string
  role?: WorkspaceRole
  canInvite?: boolean
}): Promise<void> {
  const response = await fetch(
    `/api/workspaces/${payload.workspaceId}/members/${payload.memberId}`,
    {
      method: "PATCH",
      headers: getJsonHeaders(),
      body: JSON.stringify({
        role: payload.role,
        canInvite: payload.canInvite,
      }),
    },
  )

  await parseJson<{ ok: true }>(response)
}

export async function removeWorkspaceMember(payload: {
  workspaceId: string
  memberId: string
}): Promise<void> {
  const response = await fetch(
    `/api/workspaces/${payload.workspaceId}/members/${payload.memberId}`,
    {
      method: "DELETE",
    },
  )

  await parseJson<{ ok: true }>(response)
}

export async function getWorkspaceCollections(payload: {
  workspaceId: string
  sinceRevision?: number
}): Promise<{
  unchanged?: boolean
  revision: number
  links?: WorkspaceCollections["links"]
  notes?: WorkspaceCollections["notes"]
  snippets?: WorkspaceCollections["snippets"]
  statuses?: WorkspaceCollections["statuses"]
}> {
  const url = new URL(`/api/workspaces/${payload.workspaceId}/collections`, window.location.origin)
  if (typeof payload.sinceRevision === "number") {
    url.searchParams.set("sinceRevision", String(payload.sinceRevision))
  }

  const response = await fetch(url.toString(), {
    method: "GET",
  })

  return parseJson<{
    unchanged?: boolean
    revision: number
    links?: WorkspaceCollections["links"]
    notes?: WorkspaceCollections["notes"]
    snippets?: WorkspaceCollections["snippets"]
    statuses?: WorkspaceCollections["statuses"]
  }>(response)
}

export async function putWorkspaceCollection(payload: {
  workspaceId: string
  collection: keyof WorkspaceCollections
  baseRevision: number
  items: WorkspaceCollections[keyof WorkspaceCollections]
}): Promise<
  | { ok: true; revision: number }
  | ({ ok?: false; error: string; revision: number } & WorkspaceCollections)
> {
  const response = await fetch(
    `/api/workspaces/${payload.workspaceId}/collections/${payload.collection}`,
    {
      method: "PUT",
      headers: getJsonHeaders(),
      body: JSON.stringify({
        baseRevision: payload.baseRevision,
        items: payload.items,
      }),
    },
  )

  const raw = (await response.json()) as
    | { ok: true; revision: number }
    | ({ error: string; revision: number } & WorkspaceCollections)
    | ApiError

  if (response.ok) {
    return raw as { ok: true; revision: number }
  }

  if (response.status === 409 && typeof raw === "object" && raw && "revision" in raw) {
    return raw as { ok?: false; error: string; revision: number } & WorkspaceCollections
  }

  const error = (raw as ApiError).error || "Request failed"
  throw new Error(error)
}

export function workspaceSummaryToConnection(
  workspace: WorkspaceSummary,
  nowIso = new Date().toISOString(),
): WorkspaceConnection {
  return {
    workspaceId: workspace.workspaceId,
    slug: workspace.slug,
    role: workspace.role,
    displayName: workspace.displayName,
    revision: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}
