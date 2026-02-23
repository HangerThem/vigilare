import { NextResponse, NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get("domain")

  if (!domain) {
    return new NextResponse("Missing url parameter", { status: 400 })
  }

  if (!/^[a-z0-9.-]+$/i.test(domain)) {
    return new NextResponse("Invalid domain parameter", { status: 400 })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const hostname = new URL(`https://${domain}`).hostname
    const faviconCandidates = ["/favicon.ico", "/favicon"]

    for (const pathname of faviconCandidates) {
      const faviconUrl = new URL(`https://${hostname}`)
      faviconUrl.pathname = pathname

      const res = await fetch(faviconUrl.toString(), {
        signal: controller.signal,
        headers: {
          Accept: "image/*,*/*;q=0.8",
        },
      })

      if (!res.ok) continue

      const contentType = res.headers.get("Content-Type") || "image/x-icon"
      if (!contentType.startsWith("image/")) continue

      const buffer = await res.arrayBuffer()

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      })
    }

    return new NextResponse("Favicon not found", { status: 404 })
  } catch (error) {
    return new NextResponse("Failed to fetch favicon", {
      status: 500,
      statusText: (error as Error).message,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}
