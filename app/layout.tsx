import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Vigilare",
  description: "Your personal dashboard",
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
