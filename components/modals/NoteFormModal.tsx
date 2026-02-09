import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { RichTextarea } from "@/components/ui/RichTextarea"
import { useModal } from "@/context/ModalContext"
import { useNotes, NoteType, NoteCategory } from "@/context/DataContext"
import { Controller, useForm } from "react-hook-form"
import { nanoid } from "nanoid/non-secure"
import { useEffect, useRef, useState, useCallback } from "react"
import { Select } from "@/components/ui/Select"
import BacklinkPickerModal, {
  BacklinkTarget,
} from "@/components/modals/BacklinkPickerModal"

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

  const { control, handleSubmit, reset, getValues, setValue } =
    useForm<NoteFormData>()
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
      pendingBacklinkRef.current = null
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
            <div className="flex flex-col gap-1">
              <RichTextarea
                {...field}
                ref={contentRef}
                placeholder="Content (supports markdown)"
                rows={4}
                autoresize
                className="resize-none leading-relaxed"
                onBacklinkRequest={(range) => {
                  pendingBacklinkRef.current = range
                  setIsPickingBacklink(true)
                }}
              />
              <p className="text-xs text-[rgb(var(--muted))]">
                Tip: Use `*` or `_` for emphasis, `- ` or `1.` for lists, `[[`
                to insert backlinks, `Cmd/Ctrl+K` for links.
              </p>
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
