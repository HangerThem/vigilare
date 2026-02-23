import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/utils/auth/session"
import { createWorkspace, listUserWorkspaces } from "@/utils/workspaces/server"

export async function GET() {
  try {
    const user = await requireAuthenticatedUser()
    const workspaces = await listUserWorkspaces(user.id)
    return NextResponse.json({ workspaces })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list workspaces",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser()
    const body = (await request.json()) as {
      displayName?: string
      collections?: unknown
    }

    const workspace = await createWorkspace({
      userId: user.id,
      displayName: body.displayName?.trim() || "Untitled Workspace",
      collections: body.collections,
    })

    return NextResponse.json({ workspace })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create workspace",
      },
      { status: 500 },
    )
  }
}
