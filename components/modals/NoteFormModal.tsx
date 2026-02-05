import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { useModalOpen } from "@/context/ModalOpenContext"
import { Controller, useForm } from "react-hook-form"
import { NoteType, NoteCategory } from "@/components/panels/NotesPanel"
import { nanoid } from "nanoid/non-secure"
import { useEffect, useState } from "react"
import { Select } from "../ui/Select"

type NoteFormData = Omit<NoteType, "id">

export interface NoteFormModalProps {
  notes: NoteType[]
  setNotes: (notes: NoteType[]) => void
  editingId: string | null
  setEditingId: (id: string | null) => void
}

export default function NoteFormModal({
  notes,
  setNotes,
  editingId,
  setEditingId,
}: NoteFormModalProps) {
  const [categoryOptions] = useState(
    Object.values(NoteCategory).map((cat) => ({
      value: cat,
      label: cat.charAt(0) + cat.slice(1).toLowerCase(),
    })),
  )

  const { closeModal, isModalOpen } = useModalOpen()
  const isOpen = isModalOpen("notes")

  const { register, control, handleSubmit, reset } = useForm<NoteFormData>()

  const handleAddNote = (data: NoteFormData) => {
    const { category, title, content } = data
    setNotes([...notes, { id: nanoid(), category, title, content }])
    closeModal()
  }

  const handleEditNote = (data: NoteFormData) => {
    const { category, title, content } = data
    const newNotes = [...notes]
    const index = newNotes.findIndex((note) => note.id === editingId!)
    newNotes[index] = { id: editingId!, category, title, content }
    setNotes(newNotes)
    setEditingId(null)
    closeModal()
  }

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      reset({ category: "" as NoteCategory, title: "", content: "" })
      return
    }

    if (editingId) {
      const note = notes.find((n) => n.id === editingId)
      if (note) {
        reset({
          category: note.category,
          title: note.title,
          content: note.content,
        })
      }
    } else {
      reset({ category: "" as NoteCategory, title: "", content: "" })
    }
  }, [isOpen, editingId, notes, reset, setEditingId])

  return (
    <Modal name="notes">
      <h2 className="font-bold text-2xl mb-4">
        {editingId ? "Edit Note" : "Add Note"}
      </h2>
      <form
        onSubmit={handleSubmit(editingId ? handleEditNote : handleAddNote)}
        className="flex flex-col gap-2 p-2 w-120"
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
        <Input
          {...register("title", { required: true })}
          placeholder="Title"
          autoFocus
        />
        <Textarea
          {...register("content", { required: true })}
          placeholder="Content"
          autoresize
          rows={4}
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
