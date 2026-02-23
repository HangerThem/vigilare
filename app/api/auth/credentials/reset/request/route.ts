import { NextRequest, NextResponse } from "next/server"
import { generatePasswordResetToken, hashPasswordResetToken } from "@/utils/auth/reset"
import { sendPasswordResetEmail } from "@/utils/auth/email"
import { prisma } from "@/utils/prisma"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string }
    const email = normalizeEmail(body.email ?? "")

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        passwordCredential: {
          select: { id: true },
        },
      },
    })

    if (user?.passwordCredential) {
      const token = generatePasswordResetToken()
      const tokenHash = hashPasswordResetToken(token)

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      })

      await sendPasswordResetEmail({
        to: email,
        token,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to request password reset",
      },
      { status: 500 },
    )
  }
}
