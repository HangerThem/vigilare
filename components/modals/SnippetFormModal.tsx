import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { useModal } from "@/context/ModalContext"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import hljs from "highlight.js"
import { Select } from "@/components/ui/Select"
import { Snippet, SnippetSchema } from "@/types/Snippet.type"
import { useSnippets } from "@/context/DataContext"

type SnippetFormData = Omit<Snippet, "id" | "type">

const defaultValues: SnippetFormData = {
  title: "",
  content: "",
  language: "bash",
}

export default function SnippetFormModal() {
  const { add, update, editingId, setEditingId, editingItem } = useSnippets()
  const { closeModal, isModalOpen } = useModal()
  const isOpen = isModalOpen("snippets")

  const { control, handleSubmit, reset } = useForm<SnippetFormData>({
    resolver: zodResolver(SnippetSchema),
    defaultValues,
  })

  const handleAddSnippet = (data: SnippetFormData) => {
    const { language, content, title } = data
    add(SnippetSchema.parse({ language, content, title }))
    closeModal()
  }

  const handleEditSnippet = (data: SnippetFormData) => {
    const { language, content, title } = data
    if (editingId) {
      update(editingId, { content, title, language })
    }
    setEditingId(null)
    closeModal()
  }

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      reset(defaultValues)
      return
    }

    if (editingItem) {
      reset({
        language: editingItem.language,
        title: editingItem.title,
        content: editingItem.content,
      })
    } else {
      reset(defaultValues)
    }
  }, [isOpen, editingItem, reset, setEditingId])

  return (
    <Modal name="snippets">
      <h2 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">
        {editingId ? "Edit Command" : "Add Command"}
      </h2>
      <form
        onSubmit={handleSubmit(
          editingId ? handleEditSnippet : handleAddSnippet,
        )}
        className="flex flex-col gap-2 sm:gap-3 w-full sm:w-96 md:w-120"
      >
        <Controller
          name="language"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Select
              value={field.value}
              searchable
              placeholder="Language"
              onChange={field.onChange}
              options={hljs.listLanguages().map((lang) => ({
                value: lang,
                label: lang,
              }))}
            />
          )}
        />
        <Controller
          name="title"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Input {...field} placeholder="Title" autoFocus />
          )}
        />
        <Controller
          name="content"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Textarea
              {...field}
              placeholder="Snippet Content"
              autoresize
              rows={4}
            />
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
