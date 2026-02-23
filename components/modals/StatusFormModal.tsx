import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useModal } from "@/context/ModalContext"
import { useStatuses } from "@/context/DataContext"
import { Controller, useForm } from "react-hook-form"
import { useEffect, useState } from "react"
import { Select } from "@/components/ui/Select"
import { Status, StatusSchema } from "@/types/Status.type"
import { zodResolver } from "@hookform/resolvers/zod"
import { STATUS_VARIANT_META } from "@/const/StatusVariant"
import { checkStatus } from "@/utils/status"

type StatusFormData = Omit<
  Status,
  "id" | "state" | "type" | "responseTime" | "lastChecked" | "enabled"
>

const defaultValues: StatusFormData = {
  title: "",
  url: "",
  variant: undefined,
}

export default function StatusFormModal() {
  const {
    items: statuses,
    add,
    update,
    editingId,
    setEditingId,
    editingItem,
  } = useStatuses()
  const { closeModal, isModalOpen } = useModal()
  const isOpen = isModalOpen("status")
  const editingTitle = editingItem?.title
  const editingUrl = editingItem?.url
  const editingVariant = editingItem?.variant
  const [variantOptions] = useState(
    Object.values(STATUS_VARIANT_META).map((cat) => ({
      value: cat.name.toLowerCase(),
      label: cat.name,
    })),
  )

  const { control, handleSubmit, reset } = useForm<StatusFormData>({
    resolver: zodResolver(StatusSchema),
    defaultValues,
  })

  const handleAddStatus = async (data: StatusFormData) => {
    const { url, title, variant } = data
    const newStatus = add(StatusSchema.parse({ url, title, variant }))
    closeModal()
    const state = await checkStatus(newStatus)

    update(newStatus.id, {
      state: state.state,
      responseTime: state.responseTime,
    })
  }

  const handleEditStatus = async (data: StatusFormData) => {
    const { url, title, variant } = data
    const oldStatus = statuses.find((s) => s.id === editingId)
    if (editingId) {
      update(editingId, { url, title, variant })
    }
    setEditingId(null)
    closeModal()
    if (oldStatus && oldStatus.url !== url) {
      const state = await checkStatus({ ...oldStatus, url })

      update(oldStatus.id, {
        state: state.state,
        responseTime: state.responseTime,
      })
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      reset(defaultValues)
      return
    }

    if (
      editingId &&
      editingTitle !== undefined &&
      editingUrl !== undefined
    ) {
      reset({
        url: editingUrl,
        title: editingTitle,
        variant: editingVariant,
      })
    } else {
      reset(defaultValues)
    }
  }, [
    isOpen,
    editingId,
    editingTitle,
    editingUrl,
    editingVariant,
    reset,
    setEditingId,
  ])

  return (
    <Modal name="status">
      <h2 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">
        {editingId ? "Edit Status" : "Add Status"}
      </h2>
      <form
        onSubmit={handleSubmit(editingId ? handleEditStatus : handleAddStatus)}
        className="flex flex-col gap-2 sm:gap-3 w-full sm:w-96 md:w-120"
      >
        <Controller
          name="variant"
          control={control}
          render={({ field }) => (
            <Select
              options={variantOptions}
              clearable
              value={field.value}
              placeholder="Status type"
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="title"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Input {...field} placeholder="Title" autoFocus />
          )}
        />
        <Controller
          name="url"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Input {...field} type="url" placeholder="URL" />
          )}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              closeModal()
              setEditingId(null)
            }}
          >
            Cancel
          </Button>
          <Button type="submit">{editingId ? "Save" : "Add"}</Button>
        </div>
      </form>
    </Modal>
  )
}
