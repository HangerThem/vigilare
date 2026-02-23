import "server-only"

import nodemailer from "nodemailer"

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

function getAppOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000"
}

let cachedTransporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const host = getEnv("SMTP_HOST")
  const port = Number(getEnv("SMTP_PORT"))
  const user = getEnv("SMTP_USER")
  const pass = getEnv("SMTP_PASSWORD")

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  return cachedTransporter
}

export async function sendPasswordResetEmail(payload: {
  to: string
  token: string
}): Promise<void> {
  const from = getEnv("EMAIL_FROM")
  const origin = getAppOrigin()
  const url = new URL("/", origin)
  url.searchParams.set("resetToken", payload.token)
  url.searchParams.set("email", payload.to)

  await getTransporter().sendMail({
    from,
    to: payload.to,
    subject: "Reset your Vigilare password",
    text: [
      "We received a request to reset your Vigilare password.",
      "",
      `Reset link: ${url.toString()}`,
      "",
      "If you didn't request this, you can ignore this email.",
    ].join("\n"),
    html: [
      "<p>We received a request to reset your Vigilare password.</p>",
      `<p><a href=\"${url.toString()}\">Reset your password</a></p>`,
      "<p>If you didn't request this, you can ignore this email.</p>",
    ].join(""),
  })
}
