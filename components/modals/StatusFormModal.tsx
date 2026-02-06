import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useModal } from "@/context/ModalContext"
import { useStatuses, StatusType, StatusState } from "@/context/DataContext"
import { Controller, useForm } from "react-hook-form"
import { nanoid } from "nanoid/non-secure"
import { useEffect } from "react"
import { Select } from "../ui/Select"

enum StatusOptions {
  WEBSITE = "WEBSITE",
  API = "API",
  SERVICE = "SERVICE",
  DATABASE = "DATABASE",
  HOST = "HOST",
}

type StatusFormData = Omit<StatusType, "id" | "state">

export default function StatusFormModal() {
  const {
    items: statuses,
    add,
    update,
    editingId,
    setEditingId,
    editingItem,
    setItems: setStatuses,
  } = useStatuses()
  const { closeModal, isModalOpen } = useModal()
  const isOpen = isModalOpen("status")

  const { register, control, handleSubmit, reset } = useForm<StatusFormData>()

  const handleAddStatus = async (data: StatusFormData) => {
    const { url, title, option } = data
    const newStatusId = nanoid()
    add({ id: newStatusId, url, title, option, state: "unknown" })
    closeModal()
    const state = await fetch(url)
      .then((res) => (res.ok ? "up" : "down"))
      .catch(() => "down")
    setStatuses((prevStatuses) =>
      prevStatuses.map((statusItem) =>
        statusItem.id === newStatusId
          ? { ...statusItem, state: state as StatusState }
          : statusItem,
      ),
    )
  }

  const handleEditStatus = (data: StatusFormData) => {
    const { url, title, option } = data
    const oldStatus = statuses.find((s) => s.id === editingId)
    if (editingId) {
      update(editingId, { url, title, option })
    }
    setEditingId(null)
    closeModal()
    if (oldStatus && oldStatus.url !== url) {
      fetch(url)
        .then((res) => (res.ok ? "up" : "down"))
        .catch(() => "down")
        .then((state) => {
          setStatuses((prevStatuses) =>
            prevStatuses.map((statusItem) =>
              statusItem.id === editingId
                ? { ...statusItem, state: state as StatusState }
                : statusItem,
            ),
          )
        })
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      reset({ url: "", title: "", option: undefined })
      return
    }

    if (editingItem) {
      reset({
        url: editingItem.url,
        title: editingItem.title,
        option: editingItem.option,
      })
    } else {
      reset({ url: "", title: "", option: undefined })
    }
  }, [isOpen, editingItem, reset, setEditingId])

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
          name="option"
          control={control}
          render={({ field }) => (
            <Select
              options={Array.from(Object.values(StatusOptions)).map(
                (option) => ({
                  value: option,
                  label: option.charAt(0) + option.slice(1).toLowerCase(),
                }),
              )}
              clearable
              value={field.value}
              placeholder="Status type"
              onChange={field.onChange}
            />
          )}
        />
        <Input
          {...register("title", { required: true })}
          placeholder="Title"
          autoFocus
        />
        <Input
          {...register("url", { required: true })}
          type="url"
          placeholder="URL"
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
