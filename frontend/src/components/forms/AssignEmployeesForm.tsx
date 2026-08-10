import { useMemo, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DOCUMENT_TYPES, type Contractor, type DocumentType, type Employee } from '@/types'
import {
  DOC_FILTER_OPTIONS,
  emptyDocumentFilters,
  matchesDocumentFilters,
  type DocFilterValue,
} from '@/lib/documentFilters'

export function AssignEmployeesForm({
  contractors,
  employees,
  initiallyAssignedIds,
  onSubmit,
  onCancel,
}: {
  contractors: Contractor[]
  employees: Employee[]
  initiallyAssignedIds: string[]
  onSubmit: (employeeIds: string[]) => void
  onCancel: () => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initiallyAssignedIds))
  const [expandedContractorIds, setExpandedContractorIds] = useState<Set<string>>(() => {
    const assigned = new Set(initiallyAssignedIds)
    return new Set(
      contractors
        .filter((c) => employees.some((e) => e.contractorId === c.id && assigned.has(e.id)))
        .map((c) => c.id),
    )
  })
  const [search, setSearch] = useState('')
  const [documentFilters, setDocumentFilters] = useState<Record<DocumentType, DocFilterValue>>(
    emptyDocumentFilters(),
  )

  const matchingEmployees = useMemo(() => {
    const term = search.trim().toLowerCase()
    return employees.filter((e) => {
      if (!matchesDocumentFilters(e, documentFilters)) return false
      if (!term) return true
      return `${e.firstName} ${e.lastName}`.toLowerCase().includes(term)
    })
  }, [employees, search, documentFilters])

  const employeesByContractor = useMemo(() => {
    const map = new Map<string, Employee[]>()
    for (const c of contractors) map.set(c.id, [])
    for (const e of matchingEmployees) {
      map.get(e.contractorId)?.push(e)
    }
    return map
  }, [contractors, matchingEmployees])

  function toggleEmployee(employeeId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(employeeId)) next.delete(employeeId)
      else next.add(employeeId)
      return next
    })
  }

  function setDocumentFilter(key: DocumentType, value: DocFilterValue) {
    setDocumentFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleAssign() {
    onSubmit(Array.from(selectedIds))
  }

  return (
    <div className="flex max-h-[75vh] flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-muted/30 p-3">
          {DOCUMENT_TYPES.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Select
                items={DOC_FILTER_OPTIONS}
                value={documentFilters[key]}
                onValueChange={(value) => setDocumentFilter(key, value as DocFilterValue)}
              >
                <SelectTrigger size="sm" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DOC_FILTER_OPTIONS) as DocFilterValue[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      {DOC_FILTER_OPTIONS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-border px-3 pr-1">
        <Accordion
          multiple
          value={Array.from(expandedContractorIds)}
          onValueChange={(value) => setExpandedContractorIds(new Set(value as string[]))}
        >
          {contractors.map((c) => {
            const list = employeesByContractor.get(c.id) ?? []
            return (
              <AccordionItem key={c.id} value={c.id}>
                <AccordionTrigger>
                  {c.name}
                  <span className="ml-1.5 font-normal text-muted-foreground">({list.length})</span>
                </AccordionTrigger>
                <AccordionContent>
                  {list.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No employees match the current search/filters.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {list.map((e) => (
                        <label
                          key={e.id}
                          className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted"
                        >
                          <Checkbox
                            checked={selectedIds.has(e.id)}
                            onCheckedChange={() => toggleEmployee(e.id)}
                          />
                          <span className="font-medium">
                            {e.firstName} {e.lastName}
                          </span>
                          {e.visaType && (
                            <span className="text-xs text-muted-foreground">{e.visaType}</span>
                          )}
                          {e.workingRight && (
                            <span className="text-xs text-muted-foreground">· {e.workingRight}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-sm text-muted-foreground">
          {selectedIds.size} employee{selectedIds.size === 1 ? '' : 's'} selected
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAssign}>
            Assign
          </Button>
        </div>
      </div>
    </div>
  )
}
