import { Status } from "@/types/Status.type"

type CheckStatusResult = {
  id: string
  state: "up" | "down"
  responseTime: number
}

export async function checkStatus(status: Status): Promise<CheckStatusResult> {
  const result: CheckStatusResult = {
    id: status.id,
    state: "down",
    responseTime: 0,
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const domain = new URL(status.url).hostname

    const res = await fetch(`/status?domain=${domain}`)

    if (res.ok) {
      clearTimeout(timeoutId)
      const data = await res.json()
      result.state = "up"
      result.responseTime = data.responseTime
    }
  } catch (error) {
    console.error("Error checking status:", error)
  }

  return result
}
