import Modal from "@/components/modals/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useModalOpen } from "@/context/ModalOpenContext"
import { Controller, useForm } from "react-hook-form"
import { LinkType, LinkCategory } from "@/components/panels/LinksPanel"
import { nanoid } from "nanoid/non-secure"
import { useEffect, useState } from "react"
import { Select } from "../ui/Select"

type LinkFormData = Omit<LinkType, "id">

export interface LinkFormModalProps {
  links: LinkType[]
  setLinks: (links: LinkType[]) => void
  editingId: string | null
  setEditingId: (id: string | null) => void
}

export default function LinkFormModal({
  links,
  setLinks,
  editingId,
  setEditingId,
}: LinkFormModalProps) {
  const [categoryOptions] = useState(
    Object.values(LinkCategory).map((cat) => ({
      value: cat,
      label: cat.charAt(0) + cat.slice(1).toLowerCase(),
    })),
  )

  const { closeModal, isModalOpen } = useModalOpen()
  const isOpen = isModalOpen("links")

  const { register, control, handleSubmit, reset } = useForm<LinkFormData>()

  const handleAddLink = (data: LinkFormData) => {
    const { category, url, title } = data
    setLinks([...links, { id: nanoid(), category, url, title }])
    closeModal()
  }

  const handleEditLink = (data: LinkFormData) => {
    const { category, url, title } = data
    const newLinks = [...links]
    const index = newLinks.findIndex((link) => link.id === editingId!)
    newLinks[index] = { id: editingId!, category, url, title }
    setLinks(newLinks)
    setEditingId(null)
    closeModal()
  }

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      reset({ category: "" as LinkCategory, url: "", title: "" })
      return
    }

    if (editingId) {
      const link = links.find((l) => l.id === editingId)
      if (link) {
        reset({
          category: link.category,
          url: link.url,
          title: link.title,
        })
      }
    } else {
      reset({ category: "" as LinkCategory, url: "", title: "" })
    }
  }, [isOpen, editingId, links, reset, setEditingId])

  return (
    <Modal name="links">
      <h2 className="font-bold text-2xl mb-4">
        {editingId ? "Edit Link" : "Add Link"}
      </h2>
      <form
        onSubmit={handleSubmit(editingId ? handleEditLink : handleAddLink)}
        className="flex flex-col gap-2 p-2 w-120"
      >
        <Controller
          name="category"
          control={control}
          defaultValue={"" as LinkCategory}
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
          {...register("title", {
            required: true,
          })}
          autoFocus
          placeholder="Title"
        />
        <Input
          {...register("url", {
            required: true,
          })}
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
