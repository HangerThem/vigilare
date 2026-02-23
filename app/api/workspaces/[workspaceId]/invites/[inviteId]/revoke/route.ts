import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/utils/auth/session"
import {
  canRoleInvite,
  requireWorkspaceMembership,
  revokeWorkspaceInvite,
} from "@/utils/workspaces/server"

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ workspaceId: string; inviteId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser()
    const { workspaceId, inviteId } = await context.params
    const { member } = await requireWorkspaceMembership({
      workspaceId,
      userId: user.id,
    })

    if (!canRoleInvite(member.role, member.canInvite)) {
      return NextResponse.json(
        { error: "Only admin/invite-enabled members can revoke invites" },
        { status: 403 },
      )
    }

    await revokeWorkspaceInvite({ workspaceId, inviteId })
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
        error: error instanceof Error ? error.message : "Failed to revoke invite",
      },
      { status: 500 },
    )
  }
}
