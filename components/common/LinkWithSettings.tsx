import { useSettings } from "@/context/SettingsContext"
import Link, { LinkProps } from "next/link"
import { ReactNode } from "react"

interface LinkWithSettingsProps extends LinkProps {
  children: ReactNode
  className?: string
}

export default function LinkWithSettings({
  children,
  className,
  ...props
}: LinkWithSettingsProps) {
  const { settings } = useSettings()
  return (
    <Link className={className} target={settings.openLinksInNewTab ? "_blank" : "_self"} {...props}>
      {children}
    </Link>
  )
}
