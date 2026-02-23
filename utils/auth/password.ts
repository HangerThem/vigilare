import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

function encodePasswordHash(salt: Buffer, digest: Buffer): string {
  return `${salt.toString("base64")}:${digest.toString("base64")}`
}

function decodePasswordHash(serialized: string): {
  salt: Buffer
  digest: Buffer
} | null {
  const parts = serialized.split(":")
  if (parts.length !== 2) return null

  const [saltB64, digestB64] = parts
  if (!saltB64 || !digestB64) return null

  try {
    const salt = Buffer.from(saltB64, "base64")
    const digest = Buffer.from(digestB64, "base64")
    if (salt.length === 0 || digest.length === 0) {
      return null
    }

    return { salt, digest }
  } catch {
    return null
  }
}

export function createPasswordHash(password: string): string {
  const normalized = password.trim()
  if (normalized.length < 8) {
    throw new Error("Password must be at least 8 characters")
  }

  const salt = randomBytes(16)
  const digest = scryptSync(normalized, salt, 32)
  return encodePasswordHash(salt, digest)
}

export function verifyPasswordHash(password: string, serializedHash: string): boolean {
  const parsed = decodePasswordHash(serializedHash)
  if (!parsed) {
    return false
  }

  const candidate = scryptSync(password.trim(), parsed.salt, parsed.digest.length)
  if (candidate.length !== parsed.digest.length) {
    return false
  }

  return timingSafeEqual(candidate, parsed.digest)
}
