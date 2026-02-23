import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/utils/auth/session"
import {
  listWorkspaceMembers,
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

    if (member.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can view members" },
        { status: 403 },
      )
    }

    const members = await listWorkspaceMembers(workspaceId)
    return NextResponse.json({ members })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list members",
      },
      { status: 500 },
    )
  }
}
