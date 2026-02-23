import { NextRequest, NextResponse } from "next/server"
import { isHiddenPasskeyEmail } from "@/auth"
import { createPasswordHash } from "@/utils/auth/password"
import { getAuthenticatedUser } from "@/utils/auth/session"
import { prisma } from "@/utils/prisma"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      displayName?: string
      email?: string
      password?: string
    }

    const email = normalizeEmail(body.email ?? "")
    const password = body.password?.trim() ?? ""
    const displayName = body.displayName?.trim() || "Vigilare User"

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }
    if (isHiddenPasskeyEmail(email)) {
      return NextResponse.json(
        { error: "Use a real email address for credentials" },
        { status: 400 },
      )
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      )
    }

    const currentUser = await getAuthenticatedUser()
    const existingEmailUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (currentUser) {
      if (existingEmailUser && existingEmailUser.id !== currentUser.id) {
        return NextResponse.json(
          { error: "This email is already registered" },
          { status: 409 },
        )
      }

      const updatedUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: {
          name: displayName,
          email,
        },
      })

      const passwordHash = createPasswordHash(password)
      await prisma.passwordCredential.upsert({
        where: { userId: currentUser.id },
        update: {
          passwordHash,
          passwordAlgo: "scrypt-v1",
        },
        create: {
          userId: currentUser.id,
          passwordHash,
          passwordAlgo: "scrypt-v1",
        },
      })

      const hasPasskey = await prisma.authenticator.count({
        where: { userId: currentUser.id },
        take: 1,
      })

      return NextResponse.json({
        account: {
          userId: currentUser.id,
          displayName: updatedUser.name ?? updatedUser.email ?? "Vigilare User",
          email: updatedUser.email,
          authMethods: hasPasskey > 0 ? ["credentials", "passkey"] : ["credentials"],
        },
      })
    }

    if (existingEmailUser) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 },
      )
    }

    const user = await prisma.user.create({
      data: {
        name: displayName,
        email,
      },
    })

    const passwordHash = createPasswordHash(password)
    await prisma.passwordCredential.create({
      data: {
        userId: user.id,
        passwordHash,
        passwordAlgo: "scrypt-v1",
      },
    })

    return NextResponse.json({
      account: {
        userId: user.id,
        displayName: user.name ?? user.email ?? "Vigilare User",
        email: user.email,
        authMethods: ["credentials"],
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to register credentials",
      },
      { status: 500 },
    )
  }
}
