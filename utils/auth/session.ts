import "server-only"

import { auth } from "@/auth"
import { prisma } from "@/utils/prisma"

export interface AuthenticatedUser {
  id: string
  name: string | null
  email: string | null
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await auth()
  const userId = session?.user?.id
  const sessionEmail = session?.user?.email?.trim().toLowerCase() ?? null

  if (!userId && !sessionEmail) {
    return null
  }

  const userById = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })
    : null

  const user =
    userById ??
    (sessionEmail
      ? await prisma.user.findUnique({
          where: { email: sessionEmail },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : null)

  if (!user) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new Error("UNAUTHORIZED")
  }

  return user
}
