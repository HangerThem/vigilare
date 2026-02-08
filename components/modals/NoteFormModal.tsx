import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { useModal } from "@/context/ModalContext"
import { useNotes, NoteType, NoteCategory } from "@/context/DataContext"
import { Controller, useForm } from "react-hook-form"
import { nanoid } from "nanoid/non-secure"
import { useEffect, useState } from "react"
import { Select } from "@/components/ui/Select"

type NoteFormData = Omit<NoteType, "id">

export default function NoteFormModal() {
  const { add, update, editingId, setEditingId, editingItem } = useNotes()
  const [categoryOptions] = useState(
    Object.values(NoteCategory).map((cat) => ({
      value: cat,
      label: cat.charAt(0) + cat.slice(1).toLowerCase(),
    })),
  )

  const { closeModal, isModalOpen } = useModal()
  const isOpen = isModalOpen("notes")

  const { control, handleSubmit, reset } = useForm<NoteFormData>()

  const handleAddNote = (data: NoteFormData) => {
    const { category, title, content } = data
    add({ id: nanoid(), category, title, content })
    closeModal()
  }

  const handleEditNote = (data: NoteFormData) => {
    const { category, title, content } = data
    if (editingId) {
      update(editingId, { category, title, content })
    }
    setEditingId(null)
    closeModal()
  }

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      reset({ category: NoteCategory.OTHER, title: "", content: "" })
      return
    }

    if (editingItem) {
      reset({
        category: editingItem.category,
        title: editingItem.title,
        content: editingItem.content,
      })
    } else {
      reset({ category: NoteCategory.OTHER, title: "", content: "" })
    }
  }, [isOpen, editingItem, reset, setEditingId])

  return (
    <Modal name="notes">
      <h2 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">
        {editingId ? "Edit Note" : "Add Note"}
      </h2>
      <form
        onSubmit={handleSubmit(editingId ? handleEditNote : handleAddNote)}
        className="flex flex-col gap-2 sm:gap-3 w-full sm:w-96 md:w-120"
      >
        <Controller
          name="category"
          control={control}
          defaultValue={"" as NoteCategory}
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
          defaultValue=""
          render={({ field }) => <Input {...field} placeholder="Title" />}
        />
        <Controller
          name="content"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Textarea {...field} placeholder="Content" autoresize rows={4} />
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
