import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/utils/auth/session"
import {
  canRoleWrite,
  requireWorkspaceMembership,
  updateWorkspaceCollection,
  WorkspaceCollectionKey,
} from "@/utils/workspaces/server"

function parseCollection(value: string): WorkspaceCollectionKey | null {
  if (value === "links" || value === "notes" || value === "snippets" || value === "statuses") {
    return value
  }

  return null
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; collection: string }> },
) {
  try {
    const user = await requireAuthenticatedUser()
    const { workspaceId, collection: rawCollection } = await context.params
    const collection = parseCollection(rawCollection)
    if (!collection) {
      return NextResponse.json({ error: "Invalid collection" }, { status: 400 })
    }

    const { member } = await requireWorkspaceMembership({
      workspaceId,
      userId: user.id,
    })

    if (!canRoleWrite(member.role)) {
      return NextResponse.json({ error: "Read-only membership" }, { status: 403 })
    }

    const body = (await request.json()) as {
      baseRevision?: number
      items?: unknown
    }

    const baseRevision = Number(body.baseRevision)
    if (!Number.isFinite(baseRevision) || baseRevision < 0) {
      return NextResponse.json({ error: "Invalid baseRevision" }, { status: 400 })
    }

    const result = await updateWorkspaceCollection({
      workspaceId,
      collection,
      baseRevision: Math.floor(baseRevision),
      items: body.items,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Revision conflict",
          revision: result.revision,
          ...result.collections,
        },
        { status: 409 },
      )
    }

    return NextResponse.json({
      ok: true,
      revision: result.revision,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 })
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update collection",
      },
      { status: 500 },
    )
  }
}
