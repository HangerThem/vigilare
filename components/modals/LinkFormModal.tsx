import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useModal } from "@/context/ModalContext"
import { useLinks, LinkType, LinkCategory } from "@/context/DataContext"
import { Controller, useForm } from "react-hook-form"
import { nanoid } from "nanoid/non-secure"
import { useEffect, useState } from "react"
import { Select } from "@/components/ui/Select"

type LinkFormData = Omit<LinkType, "id">

export default function LinkFormModal() {
  const { add, update, editingId, setEditingId, editingItem } = useLinks()
  const [categoryOptions] = useState(
    Object.values(LinkCategory).map((cat) => ({
      value: cat,
      label: cat.charAt(0) + cat.slice(1).toLowerCase(),
    })),
  )

  const { closeModal, isModalOpen } = useModal()
  const isOpen = isModalOpen("links")

  const { control, handleSubmit, reset } = useForm<LinkFormData>()

  const handleAddLink = (data: LinkFormData) => {
    const { category, url, title } = data
    add({ id: nanoid(), category, url, title })
    closeModal()
  }

  const handleEditLink = (data: LinkFormData) => {
    const { category, url, title } = data
    if (editingId) {
      update(editingId, { category, url, title })
    }
    setEditingId(null)
    closeModal()
  }

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      reset({ category: LinkCategory.OTHER, url: "", title: "" })
      return
    }

    if (editingItem) {
      reset({
        category: editingItem.category,
        url: editingItem.url,
        title: editingItem.title,
      })
    } else {
      reset({ category: LinkCategory.OTHER, url: "", title: "" })
    }
  }, [isOpen, editingItem, reset, setEditingId])

  return (
    <Modal name="links">
      <h2 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">
        {editingId ? "Edit Link" : "Add Link"}
      </h2>
      <form
        onSubmit={handleSubmit(
          editingId ? handleEditLink : handleAddLink,
          (errors) => console.error("Form validation errors:", errors),
        )}
        className="flex flex-col gap-2 sm:gap-3 w-full sm:w-96 md:w-120"
      >
        <Controller
          name="category"
          control={control}
          defaultValue={LinkCategory.OTHER}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              value={field.value}
              clearable
              placeholder="Category"
              onChange={field.onChange}
              options={categoryOptions}
            />
          )}
        />
        <Controller
          name="title"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input {...field} autoFocus placeholder="Title" />
          )}
        />
        <Controller
          name="url"
          control={control}
          rules={{ required: true }}
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
