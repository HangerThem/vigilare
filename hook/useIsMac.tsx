"use client"

export default function useIsMac() {
  if (typeof navigator === "undefined") return false
  return /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent)
}
