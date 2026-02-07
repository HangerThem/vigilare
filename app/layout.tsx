import type { Metadata, Viewport } from "next"
import { Providers } from "./providers"
import { Analytics } from "@vercel/analytics/next"
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vigilare",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "rgb(var(--background))",
}

const themeScript = `
  (function() {
    function getTheme() {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
      if (stored === 'system' || !stored) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    document.documentElement.classList.add(getTheme());
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased bg-[rgb(var(--background))] text-[rgb(var(--foreground))] transition-colors duration-200">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
