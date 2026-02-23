import { NextRequest, NextResponse } from "next/server"
import { createPasswordHash } from "@/utils/auth/password"
import { hashPasswordResetToken } from "@/utils/auth/reset"
import { prisma } from "@/utils/prisma"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string
      token?: string
      newPassword?: string
    }

    const email = normalizeEmail(body.email ?? "")
    const token = body.token?.trim() ?? ""
    const newPassword = body.newPassword?.trim() ?? ""

    if (!email || !token || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Email, reset token, and new password are required" },
        { status: 400 },
      )
    }

    const tokenHash = hashPasswordResetToken(token)

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (
      !resetToken ||
      resetToken.consumedAt ||
      resetToken.expiresAt.getTime() <= Date.now() ||
      resetToken.user.email !== email
    ) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    await prisma.$transaction(async (tx: any) => {
      const passwordHash = createPasswordHash(newPassword)
      await tx.passwordCredential.upsert({
        where: { userId: resetToken.userId },
        update: {
          passwordHash,
          passwordAlgo: "scrypt-v1",
        },
        create: {
          userId: resetToken.userId,
          passwordHash,
          passwordAlgo: "scrypt-v1",
        },
      })

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          consumedAt: new Date(),
        },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to confirm password reset",
      },
      { status: 500 },
    )
  }
}
