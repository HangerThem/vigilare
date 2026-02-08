"use client"

import Modal from "@/components/modals/Modal"
import { Input } from "@/components/ui/Input"
import { useModal } from "@/context/ModalContext"
import { useForm, Controller } from "react-hook-form"
import { importAppDataFromEncoded } from "@/utils/appData"
import { Button } from "@/components/ui/Button"

type FormData = {
  text: string
}

export default function ImportFromTextModal() {
  const { closeModal } = useModal()
  const { handleSubmit, control, reset } = useForm<FormData>({
    defaultValues: {
      text: "",
    },
  })

  const onSubmit = (data: FormData) => {
    importAppDataFromEncoded(data.text)
    reset()
    closeModal()
  }

  return (
    <Modal name="importFromText">
      <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
        Import from Text
      </h1>
      <div className="w-full sm:w-96 md:w-140 lg:w-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Controller
            name="text"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                placeholder="Search links, notes, commands..."
                autoFocus
              />
            )}
          />
          <Button type="submit" className="mt-3">
            Import
          </Button>
        </form>
      </div>
    </Modal>
  )
}
