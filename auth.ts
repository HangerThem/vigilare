import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Passkey from "next-auth/providers/passkey"
import { prisma } from "@/utils/prisma"
import { verifyPasswordHash } from "@/utils/auth/password"

export const PASSKEY_EMAIL_DOMAIN = "auth.vigilare.local"

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase()
}

export function isHiddenPasskeyEmail(email: string): boolean {
  return normalizeEmail(email).endsWith(`@${PASSKEY_EMAIL_DOMAIN}`)
}

export function buildHiddenPasskeyEmail(): string {
  return `passkey+${crypto.randomUUID()}@${PASSKEY_EMAIL_DOMAIN}`
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  experimental: {
    enableWebAuthn: true,
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailRaw = typeof credentials?.email === "string" ? credentials.email : ""
        const password = typeof credentials?.password === "string" ? credentials.password : ""
        const email = normalizeEmail(emailRaw)

        if (!email || !password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            passwordCredential: true,
          },
        })

        if (!user?.passwordCredential) {
          return null
        }

        const isValid = verifyPasswordHash(password, user.passwordCredential.passwordHash)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
    }),
    Passkey({
      id: "passkey",
      name: "Passkey",
    }),
  ],
  callbacks: {
    async session({ session, user, token }) {
      const sessionUserId = user?.id ?? (typeof token?.sub === "string" ? token.sub : null)
      if (session.user) {
        session.user.id = sessionUserId ?? session.user.id
        session.user.name =
          session.user.name ??
          (typeof token?.name === "string" ? token.name : null) ??
          user?.name ??
          null
        session.user.email =
          session.user.email ??
          (typeof token?.email === "string" ? token.email : null) ??
          user?.email ??
          null
      }

      return session
    },
  },
})
