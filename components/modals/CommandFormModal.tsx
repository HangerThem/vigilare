import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { useModal } from "@/context/ModalContext"
import { useCommands, CommandType } from "@/context/DataContext"
import { Controller, useForm } from "react-hook-form"
import { nanoid } from "nanoid/non-secure"
import { useEffect } from "react"
import hljs from "highlight.js"
import { Select } from "../ui/Select"

type CommandFormData = Omit<CommandType, "id">

export default function CommandFormModal() {
  const { add, update, editingId, setEditingId, editingItem } = useCommands()
  const { closeModal, isModalOpen } = useModal()
  const isOpen = isModalOpen("commands")

  const { control, handleSubmit, reset } = useForm<CommandFormData>()

  const handleAddCommand = (data: CommandFormData) => {
    const { language, code, title } = data
    add({ id: nanoid(), code, title, language })
    closeModal()
  }

  const handleEditCommand = (data: CommandFormData) => {
    const { language, code, title } = data
    if (editingId) {
      update(editingId, { code, title, language })
    }
    setEditingId(null)
    closeModal()
  }

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      reset({ language: "", title: "", code: "" })
      return
    }

    if (editingItem) {
      reset({
        language: editingItem.language,
        title: editingItem.title,
        code: editingItem.code,
      })
    } else {
      reset({ language: "", title: "", code: "" })
    }
  }, [isOpen, editingItem, reset, setEditingId])

  return (
    <Modal name="commands">
      <h2 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">
        {editingId ? "Edit Command" : "Add Command"}
      </h2>
      <form
        onSubmit={handleSubmit(
          editingId ? handleEditCommand : handleAddCommand,
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
              clearable
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
          name="code"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Textarea {...field} placeholder="Code" autoresize rows={4} />
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
