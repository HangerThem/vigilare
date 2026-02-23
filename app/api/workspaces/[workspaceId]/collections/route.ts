import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/utils/auth/session"
import {
  readWorkspaceCollections,
  requireWorkspaceMembership,
} from "@/utils/workspaces/server"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const user = await requireAuthenticatedUser()
    const { workspaceId } = await context.params

    await requireWorkspaceMembership({
      workspaceId,
      userId: user.id,
    })

    const parsedSinceRevision = Number(new URL(request.url).searchParams.get("sinceRevision") ?? "")
    const hasSinceRevision = Number.isFinite(parsedSinceRevision)

    const snapshot = await readWorkspaceCollections({ workspaceId })

    if (hasSinceRevision && parsedSinceRevision === snapshot.revision) {
      return NextResponse.json({
        unchanged: true,
        revision: snapshot.revision,
      })
    }

    return NextResponse.json({
      revision: snapshot.revision,
      ...snapshot.collections,
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
        error: error instanceof Error ? error.message : "Failed to fetch collections",
      },
      { status: 500 },
    )
  }
}
