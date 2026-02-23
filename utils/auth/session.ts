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
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

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
