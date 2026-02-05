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
  return (
    <Link className={className} {...props}>
      {children}
    </Link>
  )
}
