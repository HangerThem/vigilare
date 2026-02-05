import type { Metadata, Viewport } from "next"
import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Vigilare",
  description: "A customizable dashboard for your daily needs",
  keywords: [
    "dashboard",
    "notes",
    "links",
    "commands",
    "productivity",
    "customizable",
  ],
  authors: [{ name: "HangerThem", url: "https://hangerthem.com" }],
  creator: "HangerThem",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "rgb(var(--background))",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[rgb(var(--background))] text-[rgb(var(--foreground))] transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
