import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Contractor } from '@/types'

export interface ContractorFormValues {
  name: string
  contactName: string
  contactEmail: string
  contactPhone: string
}

const emptyValues: ContractorFormValues = {
  name: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
}

export function ContractorForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Contractor
  onSubmit: (values: ContractorFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<ContractorFormValues>(
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
        <Label htmlFor="contractor-name">Name</Label>
        <Input
          id="contractor-name"
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contractor-contact-name">Contact name</Label>
        <Input
          id="contractor-contact-name"
          value={values.contactName}
          onChange={(e) => setValues({ ...values, contactName: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contractor-contact-email">Contact email</Label>
        <Input
          id="contractor-contact-email"
          type="email"
          value={values.contactEmail}
          onChange={(e) => setValues({ ...values, contactEmail: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contractor-contact-phone">Contact phone</Label>
        <Input
          id="contractor-contact-phone"
          value={values.contactPhone}
          onChange={(e) => setValues({ ...values, contactPhone: e.target.value })}
        />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add contractor'}</Button>
      </div>
    </form>
  )
}
