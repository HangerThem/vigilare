import { NextRequest, NextResponse } from "next/server"
import { WorkspaceRole } from "@prisma/client"
import { requireAuthenticatedUser } from "@/utils/auth/session"
import {
  canAssignRole,
  canRoleInvite,
  createWorkspaceInvite,
  generateInviteCode,
  listWorkspaceInvites,
  parseWorkspaceRole,
  requireWorkspaceMembership,
} from "@/utils/workspaces/server"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser()
    const { workspaceId } = await context.params
    const { member } = await requireWorkspaceMembership({
      workspaceId,
      userId: user.id,
    })

    if (!canRoleInvite(member.role, member.canInvite)) {
      return NextResponse.json(
        { error: "Only admin/invite-enabled members can view invites" },
        { status: 403 },
      )
    }

    const invites = await listWorkspaceInvites(workspaceId)
    return NextResponse.json({ invites })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list invites",
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser()
    const { workspaceId } = await context.params
    const { member } = await requireWorkspaceMembership({
      workspaceId,
      userId: user.id,
    })

    if (!canRoleInvite(member.role, member.canInvite)) {
      return NextResponse.json(
        { error: "Only admin/invite-enabled members can create invites" },
        { status: 403 },
      )
    }

    const body = (await request.json()) as {
      role?: WorkspaceRole
      expiresInHours?: number
      maxUses?: number
    }

    const role = parseWorkspaceRole(body.role)
    if (!role) {
      return NextResponse.json(
        { error: "Role must be admin, editor, or viewer" },
        { status: 400 },
      )
    }

    if (!canAssignRole(member.role, role)) {
      return NextResponse.json(
        { error: "Insufficient permissions for this invite role" },
        { status: 403 },
      )
    }

    const expiresInHours = Math.max(1, Math.min(24 * 14, body.expiresInHours ?? 24))
    const maxUses = Math.max(1, Math.min(100, body.maxUses ?? 1))
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    const code = generateInviteCode()

    const invite = await createWorkspaceInvite({
      workspaceId,
      createdByMemberId: member.id,
      roleToGrant: role,
      expiresAt,
      maxUses,
      code,
    })

    const url = `${new URL(request.url).origin}/join/${invite.slug}`
    return NextResponse.json({ invite, code, url })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create invite",
      },
      { status: 500 },
    )
  }
}
