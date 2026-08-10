import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DOCUMENT_TYPES, type Contractor, type DocumentType, type Employee } from '@/types'

export interface EmployeeFormValues {
  contractorId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  address: string
  visaType: string
  workingRight: string
  documentExpiry: Partial<Record<DocumentType, string>>
}

type EmployeeFiles = Partial<Record<DocumentType, File>>

const emptyValues: EmployeeFormValues = {
  contractorId: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  address: '',
  visaType: '',
  workingRight: '',
  documentExpiry: {},
}

function initialValues(initial?: Employee): EmployeeFormValues {
  if (!initial) return emptyValues
  return {
    contractorId: initial.contractorId,
    firstName: initial.firstName,
    lastName: initial.lastName,
    dateOfBirth: initial.dateOfBirth,
    address: initial.address,
    visaType: initial.visaType,
    workingRight: initial.workingRight,
    documentExpiry: Object.fromEntries(
      DOCUMENT_TYPES.map(({ key }) => [key, initial.documents[key]?.expiryDate ?? '']).filter(
        ([, value]) => value,
      ),
    ),
  }
}

export function EmployeeForm({
  initial,
  contractors,
  onSubmit,
  onCancel,
}: {
  initial?: Employee
  contractors: Contractor[]
  onSubmit: (values: EmployeeFormValues, files?: EmployeeFiles) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<EmployeeFormValues>(initialValues(initial))
  const [files, setFiles] = useState<EmployeeFiles>({})

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const documentExpiry = Object.fromEntries(
      Object.entries(values.documentExpiry).filter(([, value]) => value),
    )
    onSubmit({ ...values, documentExpiry }, files)
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="employee-contractor">Sub-contractor</Label>
        <Select
          items={Object.fromEntries(contractors.map((c) => [c.id, c.name]))}
          value={values.contractorId}
          onValueChange={(value) => setValues({ ...values, contractorId: value as string })}
        >
          <SelectTrigger id="employee-contractor" className="w-full">
            <SelectValue placeholder="Select a contractor" />
          </SelectTrigger>
          <SelectContent>
            {contractors.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employee-first-name">First name</Label>
          <Input
            id="employee-first-name"
            required
            value={values.firstName}
            onChange={(e) => setValues({ ...values, firstName: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employee-last-name">Last name</Label>
          <Input
            id="employee-last-name"
            required
            value={values.lastName}
            onChange={(e) => setValues({ ...values, lastName: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="employee-dob">Date of birth</Label>
        <Input
          id="employee-dob"
          type="date"
          required
          value={values.dateOfBirth}
          onChange={(e) => setValues({ ...values, dateOfBirth: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="employee-address">Address</Label>
        <Textarea
          id="employee-address"
          value={values.address}
          onChange={(e) => setValues({ ...values, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employee-visa-type">Visa type</Label>
          <Input
            id="employee-visa-type"
            placeholder="e.g. Subclass 482"
            value={values.visaType}
            onChange={(e) => setValues({ ...values, visaType: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employee-working-right">Working right</Label>
          <Input
            id="employee-working-right"
            placeholder="e.g. Full working rights"
            value={values.workingRight}
            onChange={(e) => setValues({ ...values, workingRight: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t pt-4">
        <div>
          <p className="text-sm font-medium text-foreground">Documents</p>
          <p className="text-xs text-muted-foreground">
            Optional. Attach a file to mark a document as "Have" — an expiry date can be set with or
            without a file.
          </p>
        </div>

        {DOCUMENT_TYPES.map(({ key, label }) => {
          const current = initial?.documents[key]
          return (
            <div key={key} className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor={`employee-doc-${key}`}>
                  {label}
                  {current ? ' — replace file' : ''}
                </Label>
                {current && (
                  <p className="text-xs text-muted-foreground">Current file: {current.fileName}</p>
                )}
                <Input
                  id={`employee-doc-${key}`}
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) =>
                    setFiles({ ...files, [key]: e.target.files?.[0] })
                  }
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor={`employee-doc-expiry-${key}`}>Expiry date (optional)</Label>
                <Input
                  id={`employee-doc-expiry-${key}`}
                  type="date"
                  value={values.documentExpiry[key] ?? ''}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      documentExpiry: { ...values.documentExpiry, [key]: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!values.contractorId}>
          {initial ? 'Save changes' : 'Add employee'}
        </Button>
      </div>
    </form>
  )
}
