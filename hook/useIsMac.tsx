"use client"

export default function useIsMac() {
  const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent)

  return isMac
}
