import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { Prisma, WorkspaceRole } from "@prisma/client"
import { Link, LinkSchema } from "@/types/Link.type"
import { Note, NoteSchema } from "@/types/Note.type"
import { Snippet, SnippetSchema } from "@/types/Snippet.type"
import { Status, StatusSchema } from "@/types/Status.type"
import { prisma } from "@/utils/prisma"

export type WorkspaceCollectionKey = "links" | "notes" | "snippets" | "statuses"

export interface WorkspaceSummary {
  workspaceId: string
  slug: string
  displayName: string
  role: WorkspaceRole
  createdAt: string
  lastOpenedAt: string | null
}

export interface WorkspaceMemberSummary {
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

export interface WorkspaceCollections {
  links: Link[]
  notes: Note[]
  snippets: Snippet[]
  statuses: Status[]
}

interface ParsedCollections {
  links: Link[]
  notes: Note[]
  snippets: Snippet[]
  statuses: Status[]
}

const ROLE_WEIGHT: Record<WorkspaceRole, number> = {
  admin: 3,
  editor: 2,
  viewer: 1,
}

function getAuthSecret(): string {
  const value = process.env.AUTH_SECRET
  if (!value) {
    throw new Error("Missing AUTH_SECRET")
  }

  return value
}

function hashValue(value: string): string {
  return createHash("sha256")
    .update(`${value}.${getAuthSecret()}`)
    .digest("hex")
}

export function generateInviteCode(): string {
  const raw = randomBytes(5).toString("hex").toUpperCase()
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`
}

export function normalizeInviteCode(code: string): string {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase()
}

function hashInviteCode(code: string): string {
  return hashValue(normalizeInviteCode(code))
}

function generateInviteSlug(): string {
  return randomBytes(6).toString("base64url").toLowerCase()
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

function parseLinks(input: unknown): Link[] {
  if (!Array.isArray(input)) return []

  return input
    .map((item) => LinkSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data)
}

function parseNotes(input: unknown): Note[] {
  if (!Array.isArray(input)) return []

  return input
    .map((item) => NoteSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data)
}

function parseSnippets(input: unknown): Snippet[] {
  if (!Array.isArray(input)) return []

  return input
    .map((item) => SnippetSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data)
}

function parseStatuses(input: unknown): Status[] {
  if (!Array.isArray(input)) return []

  return input
    .map((item) => StatusSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data)
}

export function sanitizeCollections(input: unknown): ParsedCollections {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      links: [],
      notes: [],
      snippets: [],
      statuses: [],
    }
  }

  const raw = input as Record<string, unknown>

  return {
    links: parseLinks(raw.links),
    notes: parseNotes(raw.notes),
    snippets: parseSnippets(raw.snippets),
    statuses: parseStatuses(raw.statuses),
  }
}

function mapWorkspaceSummary(membership: {
  role: WorkspaceRole
  workspace: {
    id: string
    slug: string
    displayName: string
    createdAt: Date
  }
}): WorkspaceSummary {
  return {
    workspaceId: membership.workspace.id,
    slug: membership.workspace.slug,
    displayName: membership.workspace.displayName,
    role: membership.role,
    createdAt: membership.workspace.createdAt.toISOString(),
    lastOpenedAt: null,
  }
}

function mapInviteSummary(invite: {
  id: string
  slug: string
  roleToGrant: WorkspaceRole
  expiresAt: Date
  maxUses: number
  useCount: number
  revokedAt: Date | null
}): InviteSummary {
  return {
    inviteId: invite.id,
    slug: invite.slug,
    role: invite.roleToGrant,
    expiresAt: invite.expiresAt.toISOString(),
    maxUses: invite.maxUses,
    useCount: invite.useCount,
    revokedAt: toIso(invite.revokedAt),
  }
}

export function canRoleWrite(role: WorkspaceRole): boolean {
  return role === "admin" || role === "editor"
}

export function canRoleInvite(
  role: WorkspaceRole,
  canInvite: boolean,
): boolean {
  return role === "admin" || canInvite
}

export function canAssignRole(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
): boolean {
  if (actorRole === "admin") {
    return (
      targetRole === "admin" ||
      targetRole === "editor" ||
      targetRole === "viewer"
    )
  }

  return false
}

export function canManageMember(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
): boolean {
  if (actorRole === "admin") {
    return ROLE_WEIGHT[targetRole] <= ROLE_WEIGHT[actorRole]
  }

  return false
}

export function parseWorkspaceRole(value: unknown): WorkspaceRole | null {
  if (value === "admin" || value === "editor" || value === "viewer") {
    return value
  }

  return null
}

export async function listUserWorkspaces(
  userId: string,
): Promise<WorkspaceSummary[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId,
      removedAt: null,
    },
    include: {
      workspace: true,
    },
    orderBy: {
      joinedAt: "desc",
    },
    take: 200,
  })

  return memberships.map(mapWorkspaceSummary)
}

async function generateUniqueWorkspaceSlug(
  tx: Prisma.TransactionClient,
): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = randomBytes(6).toString("base64url").toLowerCase()
    const existing = await tx.workspace.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) {
      return slug
    }
  }

  throw new Error("Failed to allocate a unique workspace slug")
}

export async function createWorkspace(payload: {
  userId: string
  displayName: string
  collections?: unknown
}): Promise<WorkspaceSummary> {
  const parsedCollections = sanitizeCollections(payload.collections)

  const result = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        slug: await generateUniqueWorkspaceSlug(tx),
        displayName: payload.displayName,
        createdByUserId: payload.userId,
      },
    })

    const member = await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: payload.userId,
        role: "admin",
        canInvite: true,
      },
      include: {
        workspace: true,
      },
    })

    await replaceCollections(tx, workspace.id, parsedCollections)

    return member
  })

  return mapWorkspaceSummary(result)
}

export async function requireWorkspaceMembership(payload: {
  workspaceId: string
  userId: string
}): Promise<{
  workspace: {
    id: string
    slug: string
    displayName: string
    revision: number
  }
  member: {
    id: string
    userId: string
    role: WorkspaceRole
    canInvite: boolean
  }
}> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: payload.workspaceId,
        userId: payload.userId,
      },
    },
    include: {
      workspace: {
        select: {
          id: true,
          slug: true,
          displayName: true,
          revision: true,
        },
      },
    },
  })

  if (!membership || membership.removedAt) {
    throw new Error("FORBIDDEN")
  }

  return {
    workspace: membership.workspace,
    member: {
      id: membership.id,
      userId: membership.userId,
      role: membership.role,
      canInvite: membership.canInvite,
    },
  }
}

export async function createWorkspaceInvite(payload: {
  workspaceId: string
  createdByMemberId: string
  roleToGrant: WorkspaceRole
  expiresAt: Date
  maxUses: number
  code: string
}): Promise<InviteSummary> {
  const roleToGrant = payload.roleToGrant

  const invite = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      let slug = generateInviteSlug()

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const existing = await tx.workspaceInvite.findUnique({
          where: { slug },
          select: { id: true },
        })

        if (!existing) {
          break
        }

        slug = generateInviteSlug()
        if (attempt === 5) {
          throw new Error("Failed to generate unique invite slug")
        }
      }

      return tx.workspaceInvite.create({
        data: {
          workspaceId: payload.workspaceId,
          createdByMemberId: payload.createdByMemberId,
          slug,
          roleToGrant,
          codeHash: hashInviteCode(payload.code),
          expiresAt: payload.expiresAt,
          maxUses: payload.maxUses,
        },
      })
    },
  )

  return mapInviteSummary(invite)
}

export async function listWorkspaceInvites(
  workspaceId: string,
): Promise<InviteSummary[]> {
  const invites = await prisma.workspaceInvite.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return invites.map(mapInviteSummary)
}

export async function revokeWorkspaceInvite(payload: {
  workspaceId: string
  inviteId: string
}): Promise<void> {
  await prisma.workspaceInvite.updateMany({
    where: {
      id: payload.inviteId,
      workspaceId: payload.workspaceId,
    },
    data: {
      revokedAt: new Date(),
    },
  })
}

export async function consumeWorkspaceInvite(payload: {
  slug: string
  code: string
  userId: string
}): Promise<WorkspaceSummary> {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const invite = await tx.workspaceInvite.findUnique({
      where: {
        slug: payload.slug,
      },
      include: {
        workspace: true,
      },
    })

    if (!invite) {
      throw new Error("Invite not found")
    }

    if (invite.revokedAt) {
      throw new Error("Invite has been revoked")
    }

    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new Error("Invite has expired")
    }

    if (invite.useCount >= invite.maxUses) {
      throw new Error("Invite has already been used")
    }

    if (invite.codeHash !== hashInviteCode(payload.code)) {
      throw new Error("Invite code is invalid")
    }

    const existing = await tx.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: payload.userId,
        },
      },
      include: {
        workspace: true,
      },
    })

    let membership:
      | (typeof existing & {
          workspace: {
            id: string
            slug: string
            displayName: string
            createdAt: Date
          }
        })
      | null = existing

    if (!membership) {
      membership = await tx.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: payload.userId,
          role: invite.roleToGrant,
          canInvite: false,
        },
        include: {
          workspace: true,
        },
      })
    } else if (membership.removedAt) {
      membership = await tx.workspaceMember.update({
        where: {
          workspaceId_userId: {
            workspaceId: invite.workspaceId,
            userId: payload.userId,
          },
        },
        data: {
          removedAt: null,
          role: invite.roleToGrant,
          canInvite: false,
        },
        include: {
          workspace: true,
        },
      })
    }

    await tx.workspaceInvite.update({
      where: { id: invite.id },
      data: {
        useCount: {
          increment: 1,
        },
        usedByUserId: payload.userId,
      },
    })

    return mapWorkspaceSummary({
      role: membership.role,
      workspace: membership.workspace,
    })
  })
}

export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMemberSummary[]> {
  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      removedAt: null,
    },
    include: {
      user: true,
    },
    take: 200,
  })

  return members.map((member) => ({
    memberId: member.id,
    userId: member.userId,
    displayName: member.user.name ?? member.user.email ?? "Vigilare User",
    role: member.role,
    canInvite: member.canInvite,
    joinedAt: member.joinedAt.toISOString(),
  }))
}

export async function getWorkspaceMemberById(payload: {
  workspaceId: string
  memberId: string
}): Promise<{
  id: string
  workspaceId: string
  userId: string
  role: WorkspaceRole
  canInvite: boolean
} | null> {
  const member = await prisma.workspaceMember.findFirst({
    where: {
      id: payload.memberId,
      workspaceId: payload.workspaceId,
      removedAt: null,
    },
  })

  if (!member) {
    return null
  }

  return {
    id: member.id,
    workspaceId: member.workspaceId,
    userId: member.userId,
    role: member.role,
    canInvite: member.canInvite,
  }
}

export async function updateWorkspaceMember(payload: {
  workspaceId: string
  memberId: string
  role?: WorkspaceRole
  canInvite?: boolean
}): Promise<void> {
  const data: { role?: WorkspaceRole; canInvite?: boolean } = {}
  if (payload.role) {
    data.role = payload.role
  }
  if (typeof payload.canInvite === "boolean") {
    data.canInvite = payload.canInvite
  }

  if (Object.keys(data).length === 0) {
    return
  }

  await prisma.workspaceMember.updateMany({
    where: {
      id: payload.memberId,
      workspaceId: payload.workspaceId,
      removedAt: null,
    },
    data,
  })
}

export async function removeWorkspaceMember(payload: {
  workspaceId: string
  memberId: string
}): Promise<void> {
  await prisma.workspaceMember.updateMany({
    where: {
      id: payload.memberId,
      workspaceId: payload.workspaceId,
      removedAt: null,
    },
    data: {
      removedAt: new Date(),
      canInvite: false,
    },
  })
}

function rowToLink(row: {
  itemId: string
  title: string
  category: string
  url: string
}): Link {
  return LinkSchema.parse({
    id: row.itemId,
    type: "link",
    title: row.title,
    category: row.category,
    url: row.url,
  })
}

function rowToNote(row: {
  itemId: string
  title: string
  category: string
  content: string
}): Note {
  return NoteSchema.parse({
    id: row.itemId,
    type: "note",
    title: row.title,
    category: row.category,
    content: row.content,
  })
}

function rowToSnippet(row: {
  itemId: string
  title: string
  language: string
  content: string
}): Snippet {
  return SnippetSchema.parse({
    id: row.itemId,
    type: "snippet",
    title: row.title,
    language: row.language,
    content: row.content,
  })
}

function rowToStatus(row: {
  itemId: string
  title: string
  url: string
  variant: string | null
  state: string
  responseTime: number
  lastChecked: Date
  enabled: boolean
}): Status {
  return StatusSchema.parse({
    id: row.itemId,
    type: "status",
    title: row.title,
    url: row.url,
    variant: row.variant ?? undefined,
    state: row.state,
    responseTime: row.responseTime,
    lastChecked: row.lastChecked.toISOString(),
    enabled: row.enabled,
  })
}

export async function readWorkspaceCollections(payload: {
  workspaceId: string
}): Promise<{ revision: number; collections: WorkspaceCollections }> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: payload.workspaceId },
    select: {
      revision: true,
    },
  })

  if (!workspace) {
    throw new Error("NOT_FOUND")
  }

  const [links, notes, snippets, statuses] = await Promise.all([
    prisma.workspaceLink.findMany({
      where: { workspaceId: payload.workspaceId },
      orderBy: { position: "asc" },
    }),
    prisma.workspaceNote.findMany({
      where: { workspaceId: payload.workspaceId },
      orderBy: { position: "asc" },
    }),
    prisma.workspaceSnippet.findMany({
      where: { workspaceId: payload.workspaceId },
      orderBy: { position: "asc" },
    }),
    prisma.workspaceStatus.findMany({
      where: { workspaceId: payload.workspaceId },
      orderBy: { position: "asc" },
    }),
  ])

  return {
    revision: workspace.revision,
    collections: {
      links: links.map(rowToLink),
      notes: notes.map(rowToNote),
      snippets: snippets.map(rowToSnippet),
      statuses: statuses.map(rowToStatus),
    },
  }
}

async function replaceCollection(
  tx: Prisma.TransactionClient,
  payload: {
    workspaceId: string
    collection: WorkspaceCollectionKey
    links: Link[]
    notes: Note[]
    snippets: Snippet[]
    statuses: Status[]
  },
): Promise<void> {
  const { workspaceId, collection } = payload

  if (collection === "links") {
    await tx.workspaceLink.deleteMany({ where: { workspaceId } })
    if (payload.links.length > 0) {
      await tx.workspaceLink.createMany({
        data: payload.links.map((item, index) => ({
          workspaceId,
          itemId: item.id,
          position: index,
          title: item.title,
          category: item.category,
          url: item.url,
        })),
      })
    }
    return
  }

  if (collection === "notes") {
    await tx.workspaceNote.deleteMany({ where: { workspaceId } })
    if (payload.notes.length > 0) {
      await tx.workspaceNote.createMany({
        data: payload.notes.map((item, index) => ({
          workspaceId,
          itemId: item.id,
          position: index,
          title: item.title,
          category: item.category,
          content: item.content,
        })),
      })
    }
    return
  }

  if (collection === "snippets") {
    await tx.workspaceSnippet.deleteMany({ where: { workspaceId } })
    if (payload.snippets.length > 0) {
      await tx.workspaceSnippet.createMany({
        data: payload.snippets.map((item, index) => ({
          workspaceId,
          itemId: item.id,
          position: index,
          title: item.title,
          language: item.language,
          content: item.content,
        })),
      })
    }
    return
  }

  await tx.workspaceStatus.deleteMany({ where: { workspaceId } })
  if (payload.statuses.length > 0) {
    await tx.workspaceStatus.createMany({
      data: payload.statuses.map((item, index) => ({
        workspaceId,
        itemId: item.id,
        position: index,
        title: item.title,
        url: item.url,
        variant: item.variant ?? null,
        state: item.state,
        responseTime: item.responseTime,
        lastChecked: new Date(item.lastChecked),
        enabled: item.enabled,
      })),
    })
  }
}

async function replaceCollections(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  collections: ParsedCollections,
): Promise<void> {
  await replaceCollection(tx, {
    workspaceId,
    collection: "links",
    ...collections,
  })
  await replaceCollection(tx, {
    workspaceId,
    collection: "notes",
    ...collections,
  })
  await replaceCollection(tx, {
    workspaceId,
    collection: "snippets",
    ...collections,
  })
  await replaceCollection(tx, {
    workspaceId,
    collection: "statuses",
    ...collections,
  })
}

export async function updateWorkspaceCollection(payload: {
  workspaceId: string
  collection: WorkspaceCollectionKey
  baseRevision: number
  items: unknown
}): Promise<
  | { ok: true; revision: number }
  | {
      ok: false
      reason: "conflict"
      revision: number
      collections: WorkspaceCollections
    }
> {
  const parsedItems =
    payload.collection === "links"
      ? {
          links: parseLinks(payload.items),
          notes: [],
          snippets: [],
          statuses: [],
        }
      : payload.collection === "notes"
        ? {
            links: [],
            notes: parseNotes(payload.items),
            snippets: [],
            statuses: [],
          }
        : payload.collection === "snippets"
          ? {
              links: [],
              notes: [],
              snippets: parseSnippets(payload.items),
              statuses: [],
            }
          : {
              links: [],
              notes: [],
              snippets: [],
              statuses: parseStatuses(payload.items),
            }

  const result = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.findUnique({
      where: { id: payload.workspaceId },
      select: { revision: true },
    })

    if (!workspace) {
      throw new Error("NOT_FOUND")
    }

    if (workspace.revision !== payload.baseRevision) {
      return {
        ok: false as const,
        currentRevision: workspace.revision,
      }
    }

    await replaceCollection(tx, {
      workspaceId: payload.workspaceId,
      collection: payload.collection,
      ...parsedItems,
    })

    const updated = await tx.workspace.update({
      where: { id: payload.workspaceId },
      data: {
        revision: {
          increment: 1,
        },
      },
      select: {
        revision: true,
      },
    })

    return {
      ok: true as const,
      revision: updated.revision,
    }
  })

  if (result.ok) {
    return {
      ok: true,
      revision: result.revision,
    }
  }

  const latest = await readWorkspaceCollections({
    workspaceId: payload.workspaceId,
  })

  return {
    ok: false,
    reason: "conflict",
    revision: latest.revision,
    collections: latest.collections,
  }
}
