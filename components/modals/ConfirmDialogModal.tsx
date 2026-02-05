"use client"

import Modal from "./Modal"
import { useConfirmDialog } from "@/context/ConfirmDialogContext"
import { Button } from "../ui/Button"

export default function ConfirmDialogModal() {
  const { title, message, onConfirm, onCancel } = useConfirmDialog()

  return (
    <Modal name="confirm">
      <div className="w-full sm:w-80 md:w-96">
        <h2 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">{title}</h2>
        <p className="mb-4 sm:mb-6 text-sm sm:text-base">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </Modal>
  )
}
