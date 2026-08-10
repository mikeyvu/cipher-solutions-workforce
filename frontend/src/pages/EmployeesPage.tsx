import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PlusIcon, PencilIcon, TrashIcon, ListFilterIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmployeeForm, type EmployeeFormValues } from '@/components/forms/EmployeeForm'
import { useAppData } from '@/hooks/useAppData'
import { getPdf } from '@/storage/pdfStorage'
import { DOCUMENT_TYPES, type DocumentType, type Employee } from '@/types'
import { cn } from '@/lib/utils'
import {
  DOC_FILTER_OPTIONS,
  emptyDocumentFilters,
  matchesDocumentFilters,
  type DocFilterValue,
} from '@/lib/documentFilters'

export function EmployeesPage() {
  const { employees, contractors, addEmployee, updateEmployee, deleteEmployee } = useAppData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | undefined>(undefined)
  const [columnFilters, setColumnFilters] = useState<Record<DocumentType, DocFilterValue>>(
    emptyDocumentFilters(),
  )

  const activeFilterCount = DOCUMENT_TYPES.filter(({ key }) => columnFilters[key] !== 'all').length

  const filteredEmployees = useMemo(
    () => employees.filter((employee) => matchesDocumentFilters(employee, columnFilters)),
    [employees, columnFilters],
  )

  function setColumnFilter(key: DocumentType, value: DocFilterValue) {
    setColumnFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setColumnFilters(emptyDocumentFilters())
  }

  function contractorName(contractorId: string) {
    return contractors.find((c) => c.id === contractorId)?.name ?? '—'
  }

  function openCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(employee: Employee) {
    setEditing(employee)
    setDialogOpen(true)
  }

  async function handleSubmit(values: EmployeeFormValues, files?: Partial<Record<DocumentType, File>>) {
    if (editing) {
      await updateEmployee(editing.id, values, files)
      toast.success('Employee updated')
    } else {
      await addEmployee(values, files)
      toast.success('Employee added')
    }
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    await deleteEmployee(id)
    toast.success('Employee deleted')
  }

  async function handleViewDocument(employee: Employee, docType: DocumentType) {
    const file = await getPdf(employee.id, docType)
    if (!file) {
      toast.error('Document not found')
      return
    }
    const url = URL.createObjectURL(file)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-medium text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground">All employees across sub-contractors.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={openCreate} disabled={contractors.length === 0}>
            <PlusIcon /> Add employee
          </Button>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit employee' : 'Add employee'}</DialogTitle>
            </DialogHeader>
            <EmployeeForm
              initial={editing}
              contractors={contractors}
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {contractors.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add a contractor first before you can add employees.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <ListFilterIcon className="size-4" /> Filters
        </div>
        {DOCUMENT_TYPES.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <Select
              items={DOC_FILTER_OPTIONS}
              value={columnFilters[key]}
              onValueChange={(value) => setColumnFilter(key, value as DocFilterValue)}
            >
              <SelectTrigger size="sm" className="w-32">
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
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon /> Clear all ({activeFilterCount})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {filteredEmployees.length} of {employees.length} employee
            {employees.length === 1 ? '' : 's'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No employees yet. Add one to get started.
            </p>
          ) : filteredEmployees.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No employees match the current filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Visa type</TableHead>
                  <TableHead>Working right</TableHead>
                  {DOCUMENT_TYPES.map(({ key, label }) => (
                    <TableHead key={key}>
                      <div className="flex items-center gap-1">
                        <span>{label}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className={cn(
                                  columnFilters[key] !== 'all' && 'text-primary',
                                )}
                              />
                            }
                          >
                            <ListFilterIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuRadioGroup
                              value={columnFilters[key]}
                              onValueChange={(value) =>
                                setColumnFilter(key, value as DocFilterValue)
                              }
                            >
                              {(Object.keys(DOC_FILTER_OPTIONS) as DocFilterValue[]).map((value) => (
                                <DropdownMenuRadioItem key={value} value={value}>
                                  {DOC_FILTER_OPTIONS[value]}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    <TableCell>{contractorName(employee.contractorId)}</TableCell>
                    <TableCell>{employee.visaType || '—'}</TableCell>
                    <TableCell>
                      {employee.workingRight ? (
                        <Badge variant="secondary">{employee.workingRight}</Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    {DOCUMENT_TYPES.map(({ key }) => {
                      const doc = employee.documents[key]
                      return (
                        <TableCell key={key}>
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              variant={doc ? 'success' : 'destructive'}
                              className={doc ? 'cursor-pointer' : undefined}
                              onClick={doc ? () => handleViewDocument(employee, key) : undefined}
                            >
                              {doc ? 'Have' : 'Not have'}
                            </Badge>
                            {doc?.expiryDate && (
                              <span className="text-[0.7rem] text-muted-foreground">
                                Expires {doc.expiryDate}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(employee)}>
                          <PencilIcon />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            <TrashIcon />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete {employee.firstName} {employee.lastName}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the employee, their documents, and any project
                                assignments. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(employee.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
