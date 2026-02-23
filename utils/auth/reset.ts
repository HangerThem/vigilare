import { createHash, randomBytes } from "node:crypto"

function getAuthSecret(): string {
  const value = process.env.AUTH_SECRET
  if (!value) {
    throw new Error("Missing AUTH_SECRET")
  }

  return value
}

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256")
    .update(`${token}.${getAuthSecret()}`)
    .digest("hex")
}
