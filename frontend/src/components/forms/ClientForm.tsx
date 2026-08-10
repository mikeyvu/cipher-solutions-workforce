import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Client } from '@/types'

export interface ClientFormValues {
  name: string
  contactName: string
  contactEmail: string
  contactPhone: string
}

const emptyValues: ClientFormValues = {
  name: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
}

export function ClientForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Client
  onSubmit: (values: ClientFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<ClientFormValues>(
    initial
      ? {
          name: initial.name,
          contactName: initial.contactName ?? '',
          contactEmail: initial.contactEmail ?? '',
          contactPhone: initial.contactPhone ?? '',
        }
      : emptyValues,
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="client-name">Name</Label>
        <Input
          id="client-name"
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="client-contact-name">Contact name</Label>
        <Input
          id="client-contact-name"
          value={values.contactName}
          onChange={(e) => setValues({ ...values, contactName: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="client-contact-email">Contact email</Label>
        <Input
          id="client-contact-email"
          type="email"
          value={values.contactEmail}
          onChange={(e) => setValues({ ...values, contactEmail: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="client-contact-phone">Contact phone</Label>
        <Input
          id="client-contact-phone"
          value={values.contactPhone}
          onChange={(e) => setValues({ ...values, contactPhone: e.target.value })}
        />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add client'}</Button>
      </div>
    </form>
  )
}
