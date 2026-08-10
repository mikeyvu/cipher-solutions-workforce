import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Client, Project } from '@/types'

export interface ProjectFormValues {
  clientId: string
  name: string
  siteAddress: string
}

const emptyValues: ProjectFormValues = {
  clientId: '',
  name: '',
  siteAddress: '',
}

export function ProjectForm({
  initial,
  clients,
  onSubmit,
  onCancel,
}: {
  initial?: Project
  clients: Client[]
  onSubmit: (values: ProjectFormValues) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<ProjectFormValues>(
    initial
      ? {
          clientId: initial.clientId,
          name: initial.name,
          siteAddress: initial.siteAddress ?? '',
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
        <Label htmlFor="project-client">Client</Label>
        <Select
          items={Object.fromEntries(clients.map((c) => [c.id, c.name]))}
          value={values.clientId}
          onValueChange={(value) => setValues({ ...values, clientId: value as string })}
        >
          <SelectTrigger id="project-client" className="w-full">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="project-name">Project / site name</Label>
        <Input
          id="project-name"
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="project-address">Site address</Label>
        <Input
          id="project-address"
          value={values.siteAddress}
          onChange={(e) => setValues({ ...values, siteAddress: e.target.value })}
        />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!values.clientId}>
          {initial ? 'Save changes' : 'Add project'}
        </Button>
      </div>
    </form>
  )
}
