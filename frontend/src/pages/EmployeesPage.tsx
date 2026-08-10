import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PlusIcon, PencilIcon, TrashIcon, Columns3Icon, ListFilterIcon, SearchIcon, XIcon } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
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
import { getPageNumbers } from '@/lib/pagination'
import { TOGGLEABLE_EMPLOYEE_COLUMNS } from '@/lib/employeeColumns'

const PAGE_SIZE = 20

export function EmployeesPage() {
  const { employees, contractors, addEmployee, updateEmployee, deleteEmployee } = useAppData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | undefined>(undefined)
  const [columnFilters, setColumnFilters] = useState<Record<DocumentType, DocFilterValue>>(
    emptyDocumentFilters(),
  )
  const [contractorFilter, setContractorFilter] = useState('all')
  const [visaTypeFilter, setVisaTypeFilter] = useState('all')
  const [workingRightFilter, setWorkingRightFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(TOGGLEABLE_EMPLOYEE_COLUMNS.map((c) => c.key)),
  )

  const visaTypeOptions = useMemo(
    () =>
      Array.from(new Set(employees.map((e) => e.visaType).filter((v): v is string => Boolean(v)))).sort(),
    [employees],
  )
  const workingRightOptions = useMemo(
    () =>
      Array.from(
        new Set(employees.map((e) => e.workingRight).filter((v): v is string => Boolean(v))),
      ).sort(),
    [employees],
  )

  const contractorFilterItems = useMemo<Record<string, string>>(
    () => ({ all: 'All', ...Object.fromEntries(contractors.map((c) => [c.id, c.name])) }),
    [contractors],
  )
  const visaTypeFilterItems = useMemo<Record<string, string>>(
    () => ({ all: 'All', ...Object.fromEntries(visaTypeOptions.map((v) => [v, v])) }),
    [visaTypeOptions],
  )
  const workingRightFilterItems = useMemo<Record<string, string>>(
    () => ({ all: 'All', ...Object.fromEntries(workingRightOptions.map((v) => [v, v])) }),
    [workingRightOptions],
  )

  const activeFilterCount =
    DOCUMENT_TYPES.filter(({ key }) => columnFilters[key] !== 'all').length +
    (contractorFilter !== 'all' ? 1 : 0) +
    (visaTypeFilter !== 'all' ? 1 : 0) +
    (workingRightFilter !== 'all' ? 1 : 0)

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase()
    return employees.filter((employee) => {
      if (term && !`${employee.firstName} ${employee.lastName}`.toLowerCase().includes(term)) {
        return false
      }
      if (contractorFilter !== 'all' && employee.contractorId !== contractorFilter) return false
      if (visaTypeFilter !== 'all' && employee.visaType !== visaTypeFilter) return false
      if (workingRightFilter !== 'all' && employee.workingRight !== workingRightFilter) return false
      return matchesDocumentFilters(employee, columnFilters)
    })
  }, [employees, columnFilters, contractorFilter, visaTypeFilter, workingRightFilter, search])

  const [currentPage, setCurrentPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE))
  const pagedEmployees = filteredEmployees.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [columnFilters, contractorFilter, visaTypeFilter, workingRightFilter, search])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount))
  }, [pageCount])

  function setColumnFilter(key: DocumentType, value: DocFilterValue) {
    setColumnFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setColumnFilters(emptyDocumentFilters())
    setContractorFilter('all')
    setVisaTypeFilter('all')
    setWorkingRightFilter('all')
    setSearch('')
  }

  function toggleColumn(key: string) {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        clearColumnFilter(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function clearColumnFilter(key: string) {
    if (key === 'contractor') setContractorFilter('all')
    else if (key === 'visaType') setVisaTypeFilter('all')
    else if (key === 'workingRight') setWorkingRightFilter('all')
    else setColumnFilters((prev) => ({ ...prev, [key]: 'all' }))
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
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <Columns3Icon /> Toggle columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                {TOGGLEABLE_EMPLOYEE_COLUMNS.map(({ key, label }) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={visibleColumns.has(key)}
                    onCheckedChange={() => toggleColumn(key)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
      </div>

      {contractors.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add a contractor first before you can add employees.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-8"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <ListFilterIcon />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[560px] max-w-[90vw] p-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visibleColumns.has('contractor') && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Contractor</span>
                <Select
                  items={contractorFilterItems}
                  value={contractorFilter}
                  onValueChange={(value) => setContractorFilter(value as string)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(contractorFilterItems).map((value) => (
                      <SelectItem key={value} value={value}>
                        {contractorFilterItems[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}
              {visibleColumns.has('visaType') && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Visa type</span>
                <Select
                  items={visaTypeFilterItems}
                  value={visaTypeFilter}
                  onValueChange={(value) => setVisaTypeFilter(value as string)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(visaTypeFilterItems).map((value) => (
                      <SelectItem key={value} value={value}>
                        {visaTypeFilterItems[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}
              {visibleColumns.has('workingRight') && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Working right</span>
                <Select
                  items={workingRightFilterItems}
                  value={workingRightFilter}
                  onValueChange={(value) => setWorkingRightFilter(value as string)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(workingRightFilterItems).map((value) => (
                      <SelectItem key={value} value={value}>
                        {workingRightFilterItems[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}
              {DOCUMENT_TYPES.map(({ key, label }) =>
                !visibleColumns.has(key) ? null : (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Select
                    items={DOC_FILTER_OPTIONS}
                    value={columnFilters[key]}
                    onValueChange={(value) => setColumnFilter(key, value as DocFilterValue)}
                  >
                    <SelectTrigger size="sm" className="w-full">
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
                ),
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {(activeFilterCount > 0 || search.trim() !== '') && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon /> Clear all
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
                  {visibleColumns.has('contractor') && (
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <span>Contractor</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className={cn(contractorFilter !== 'all' && 'text-primary')}
                            />
                          }
                        >
                          <ListFilterIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuRadioGroup
                            value={contractorFilter}
                            onValueChange={(value) => setContractorFilter(value as string)}
                          >
                            {Object.keys(contractorFilterItems).map((value) => (
                              <DropdownMenuRadioItem key={value} value={value}>
                                {contractorFilterItems[value]}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                  )}
                  {visibleColumns.has('visaType') && (
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <span>Visa type</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className={cn(visaTypeFilter !== 'all' && 'text-primary')}
                            />
                          }
                        >
                          <ListFilterIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuRadioGroup
                            value={visaTypeFilter}
                            onValueChange={(value) => setVisaTypeFilter(value as string)}
                          >
                            {Object.keys(visaTypeFilterItems).map((value) => (
                              <DropdownMenuRadioItem key={value} value={value}>
                                {visaTypeFilterItems[value]}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                  )}
                  {visibleColumns.has('workingRight') && (
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <span>Working right</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className={cn(workingRightFilter !== 'all' && 'text-primary')}
                            />
                          }
                        >
                          <ListFilterIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuRadioGroup
                            value={workingRightFilter}
                            onValueChange={(value) => setWorkingRightFilter(value as string)}
                          >
                            {Object.keys(workingRightFilterItems).map((value) => (
                              <DropdownMenuRadioItem key={value} value={value}>
                                {workingRightFilterItems[value]}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                  )}
                  {DOCUMENT_TYPES.map(({ key, label }) =>
                    !visibleColumns.has(key) ? null : (
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
                {pagedEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </TableCell>
                    {visibleColumns.has('contractor') && (
                      <TableCell>{contractorName(employee.contractorId)}</TableCell>
                    )}
                    {visibleColumns.has('visaType') && (
                      <TableCell>{employee.visaType || '—'}</TableCell>
                    )}
                    {visibleColumns.has('workingRight') && (
                      <TableCell>
                        {employee.workingRight ? (
                          <Badge variant="secondary">{employee.workingRight}</Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    )}
                    {DOCUMENT_TYPES.map(({ key }) => {
                      if (!visibleColumns.has(key)) return null
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
          {pageCount > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }}
                  />
                </PaginationItem>
                {getPageNumbers(currentPage, pageCount).map((page, i) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page)
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === pageCount}
                    className={currentPage === pageCount ? 'pointer-events-none opacity-50' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage((page) => Math.min(pageCount, page + 1))
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
