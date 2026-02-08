"use client"

import Modal from "@/components/modals/Modal"
import { exportState } from "@/utils/appData"
import { useEffect, useState } from "react"
import { Button } from "../ui/Button"
import { useModal } from "@/context/ModalContext"

export default function ShareDashboardModal() {
  const { closeModal } = useModal()
  const [shareUrl, setShareUrl] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const getShareUrl = () => {
      const state = exportState(localStorage)
      const encodedState = encodeURIComponent(state)
      const url = `${window.location.origin}/import?data=${encodedState}`
      setShareUrl(url)
    }

    getShareUrl()
  }, [])

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  return (
    <Modal name="shareDashboard">
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
        Share Dashboard
      </h1>
      <div className="w-full sm:w-96 md:w-140 lg:w-200">
        <div className="bg-[rgb(var(--background))] p-2 rounded-xl break-all text-sm">
          {shareUrl}
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button
          className="flex items-center justify-center"
          onClick={() => {
            navigator.clipboard.writeText(shareUrl)
            setCopied(true)
          }}
          keepWidth
        >
          {copied ? "Copied!" : "Copy to Clipboard"}
        </Button>

        <Button onClick={closeModal} variant="secondary">
          Close
        </Button>
      </div>
    </Modal>
  )
}
