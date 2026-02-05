import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { useModalOpen } from "@/context/ModalOpenContext"
import { Controller, useForm } from "react-hook-form"
import { CommandType } from "@/components/panels/CommandsPanel"
import { nanoid } from "nanoid/non-secure"
import { useEffect } from "react"
import hljs from "highlight.js"
import { Select } from "../ui/Select"

type CommandFormData = Omit<CommandType, "id">

export interface CommandFormModalProps {
  commands: CommandType[]
  setCommands: (commands: CommandType[]) => void
  editingId: string | null
  setEditingId: (id: string | null) => void
}

export default function CommandFormModal({
  commands,
  setCommands,
  editingId,
  setEditingId,
}: CommandFormModalProps) {
  const { closeModal, isModalOpen } = useModalOpen()
  const isOpen = isModalOpen("commands")

  const { register, control, handleSubmit, reset } = useForm<CommandFormData>()

  const handleAddCommand = (data: CommandFormData) => {
    const { language, code, title } = data
    setCommands([...commands, { id: nanoid(), code, title, language }])
    closeModal()
  }

  const handleEditCommand = (data: CommandFormData) => {
    const { language, code, title } = data
    const newCommands = [...commands]
    const index = newCommands.findIndex((command) => command.id === editingId!)
    newCommands[index] = { id: editingId!, code, title, language }
    setCommands(newCommands)
    setEditingId(null)
    closeModal()
  }

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      reset({ language: "", title: "", code: "" })
      return
    }

    if (editingId) {
      const command = commands.find((cmd) => cmd.id === editingId)
      if (command) {
        reset({
          language: command.language,
          title: command.title,
          code: command.code,
        })
      }
    } else {
      reset({ language: "", title: "", code: "" })
    }
  }, [isOpen, editingId, commands, reset, setEditingId])

  return (
    <Modal name="commands">
      <h2 className="font-bold text-2xl mb-4">
        {editingId ? "Edit Command" : "Add Command"}
      </h2>
      <form
        onSubmit={handleSubmit(
          editingId ? handleEditCommand : handleAddCommand,
        )}
        className="flex flex-col gap-2 p-2 w-120"
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
        <Input
          {...register("title", { required: true })}
          placeholder="Title"
          autoFocus
        />
        <Textarea
          {...register("code", {
            required: true,
          })}
          placeholder="Code"
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
