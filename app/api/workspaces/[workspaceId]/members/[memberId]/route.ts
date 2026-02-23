import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/utils/auth/session"
import {
  canAssignRole,
  canManageMember,
  getWorkspaceMemberById,
  parseWorkspaceRole,
  removeWorkspaceMember,
  requireWorkspaceMembership,
  updateWorkspaceMember,
} from "@/utils/workspaces/server"
import { WorkspaceRole } from "@prisma/client"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; memberId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser()
    const { workspaceId, memberId } = await context.params
    const { member: actor } = await requireWorkspaceMembership({
      workspaceId,
      userId: user.id,
    })
    const target = await getWorkspaceMemberById({ workspaceId, memberId })

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (!canManageMember(actor.role, target.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to manage this member" },
        { status: 403 },
      )
    }

    const body = (await request.json()) as {
      role?: WorkspaceRole
      canInvite?: boolean
    }

    const role = body.role ? parseWorkspaceRole(body.role) : null
    if (body.role && !role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (role && !canAssignRole(actor.role, role)) {
      return NextResponse.json(
        { error: "Insufficient permissions for target role" },
        { status: 403 },
      )
    }

    if (actor.id === target.id && role && role !== target.role) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 },
      )
    }

    await updateWorkspaceMember({
      workspaceId,
      memberId,
      role: role ?? undefined,
      canInvite: typeof body.canInvite === "boolean" ? body.canInvite : undefined,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update member",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ workspaceId: string; memberId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser()
    const { workspaceId, memberId } = await context.params
    const { member: actor } = await requireWorkspaceMembership({
      workspaceId,
      userId: user.id,
    })
    const target = await getWorkspaceMemberById({ workspaceId, memberId })

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (!canManageMember(actor.role, target.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions to remove this member" },
        { status: 403 },
      )
    }

    if (actor.id === target.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 },
      )
    }

    await removeWorkspaceMember({ workspaceId, memberId })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to remove member",
      },
      { status: 500 },
    )
  }
}
