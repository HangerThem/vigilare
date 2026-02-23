import { NextResponse } from "next/server"
import { isHiddenPasskeyEmail } from "@/auth"
import { getAuthenticatedUser } from "@/utils/auth/session"
import { prisma } from "@/utils/prisma"

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [hasCredentials, passkeyCount] = await Promise.all([
      prisma.passwordCredential.count({
        where: { userId: user.id },
        take: 1,
      }),
      prisma.authenticator.count({
        where: { userId: user.id },
        take: 1,
      }),
    ])

    const authMethods: Array<"credentials" | "passkey"> = []
    if (hasCredentials > 0) {
      authMethods.push("credentials")
    }
    if (passkeyCount > 0) {
      authMethods.push("passkey")
    }

    const visibleEmail =
      user.email && !isHiddenPasskeyEmail(user.email) ? user.email : null
    const displayName = user.name ?? visibleEmail ?? "Vigilare User"

    return NextResponse.json({
      account: {
        userId: user.id,
        displayName,
        email: visibleEmail,
        authMethods,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load account",
      },
      { status: 500 },
    )
  }
}
