import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { RichTextarea } from "@/components/ui/RichTextarea"
import { useModal } from "@/context/ModalContext"
import { useNotes } from "@/context/DataContext"
import { Controller, useForm } from "react-hook-form"
import { useEffect, useRef, useState, useCallback } from "react"
import { Select } from "@/components/ui/Select"
import BacklinkPickerModal, {
  BacklinkTarget,
} from "@/components/modals/BacklinkPickerModal"
import { CATEGORY_META } from "@/const/Category"
import { Note, NoteSchema } from "@/types/Note.type"
import { zodResolver } from "@hookform/resolvers/zod"

type NoteFormData = Omit<Note, "id" | "type">

const defaultValues: NoteFormData = {
  category: "other",
  title: "",
  content: "",
}

export default function NoteFormModal() {
  const { add, update, editingId, setEditingId, editingItem } = useNotes()
  const editingCategory = editingItem?.category
  const editingTitle = editingItem?.title
  const editingContent = editingItem?.content
  const [categoryOptions] = useState(
    Object.values(CATEGORY_META).map((cat) => ({
      value: cat.name.toLowerCase(),
      label: cat.name,
    })),
  )

  const { closeModal, isModalOpen } = useModal()
  const isOpen = isModalOpen("notes")

  const { control, handleSubmit, reset, getValues, setValue } =
    useForm<NoteFormData>({
      resolver: zodResolver(NoteSchema),
      defaultValues,
    })
  const [isPickingBacklink, setIsPickingBacklink] = useState(false)
  const pendingBacklinkRef = useRef<{ start: number; end: number } | null>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const insertBacklink = useCallback(
    (target: BacklinkTarget) => {
      const range = pendingBacklinkRef.current
      const value = getValues("content") ?? ""
      const start = range?.start ?? value.length
      const end = range?.end ?? value.length
      const label = target.title
      const insertion = `[${label}](backlink:${target.type}:${target.id})`
      const nextValue = value.slice(0, start) + insertion + value.slice(end)
      setValue("content", nextValue, { shouldDirty: true })
      setIsPickingBacklink(false)
      pendingBacklinkRef.current = null
      requestAnimationFrame(() => {
        const caret = start + insertion.length
        contentRef.current?.focus()
        contentRef.current?.setSelectionRange(caret, caret)
      })
    },
    [getValues, setValue],
  )

  const handleAddNote = (data: NoteFormData) => {
    const { category, title, content } = data
    add(NoteSchema.parse({ category, title, content }))
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
      pendingBacklinkRef.current = null
      reset(defaultValues)
      return
    }

    if (
      editingId &&
      editingCategory !== undefined &&
      editingTitle !== undefined &&
      editingContent !== undefined
    ) {
      reset({
        category: editingCategory,
        title: editingTitle,
        content: editingContent,
      })
    } else {
      reset(defaultValues)
    }
  }, [
    isOpen,
    editingId,
    editingCategory,
    editingTitle,
    editingContent,
    reset,
    setEditingId,
  ])

  return (
    <Modal name="notes">
      <BacklinkPickerModal
        open={isPickingBacklink}
        onClose={() => {
          setIsPickingBacklink(false)
          pendingBacklinkRef.current = null
        }}
        onPick={insertBacklink}
      />
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
            <div className="flex flex-col gap-1">
              <RichTextarea
                {...field}
                ref={contentRef}
                placeholder="Content"
                rows={4}
                autoresize
                className="resize-none leading-relaxed"
                onBacklinkRequest={(range) => {
                  pendingBacklinkRef.current = range
                  setIsPickingBacklink(true)
                }}
              />
            </div>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              closeModal()
              setEditingId(null)
              setIsPickingBacklink(false)
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
