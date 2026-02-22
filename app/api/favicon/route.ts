import { NextResponse, NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get("domain")

  if (!domain) {
    return new NextResponse("Missing url parameter", { status: 400 })
  }

  try {
    const faviconUrl = new URL(`https://${domain}`)
    faviconUrl.pathname = "/favicon"

    const res = await fetch(faviconUrl.toString())
    if (!res.ok) {
      return new NextResponse("Favicon not found", { status: 404 })
    }

    const contentType = res.headers.get("Content-Type") || "image/x-icon"
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType },
    })
  } catch (error) {
    return new NextResponse("Failed to fetch favicon", {
      status: 500,
      statusText: (error as Error).message,
    })
  }
}
