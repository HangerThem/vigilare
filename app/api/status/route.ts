import { NextResponse, NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get("domain")

  if (!domain) {
    return new NextResponse("Missing url parameter", { status: 400 })
  }

  try {
    const start = Date.now()
    const res = await fetch(`https://${domain}`, {
      method: "HEAD",
      cache: "no-store",
    })
    const responseTime = Date.now() - start

    if (!res.ok) {
      return new NextResponse("Domain not found", { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Domain found",
        responseTime,
      },
      { status: 200 },
    )
  } catch (error) {
    return new NextResponse("Failed to fetch domain", {
      status: 500,
      statusText: (error as Error).message,
    })
  }
}
