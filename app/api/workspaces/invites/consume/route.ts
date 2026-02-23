import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/utils/auth/session"
import { consumeWorkspaceInvite } from "@/utils/workspaces/server"

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser()
    const body = (await request.json()) as {
      slug?: string
      code?: string
    }

    const slug = body.slug?.trim().toLowerCase()
    const code = body.code?.trim()

    if (!slug || !code) {
      return NextResponse.json(
        { error: "Invite slug and code are required" },
        { status: 400 },
      )
    }

    const workspace = await consumeWorkspaceInvite({
      slug,
      code,
      userId: user.id,
    })

    return NextResponse.json({ workspace })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to join workspace",
      },
      { status: 400 },
    )
  }
}
