import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeftIcon, Columns3Icon, DownloadIcon, UsersIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AssignEmployeesForm } from '@/components/forms/AssignEmployeesForm'
import { useAppData } from '@/hooks/useAppData'
import { exportProjectExcel } from '@/storage/exportProjectExcel'
import { getPdf } from '@/storage/pdfStorage'
import { DOCUMENT_TYPES, type DocumentType, type Employee } from '@/types'

const TOGGLEABLE_COLUMNS: { key: string; label: string }[] = [
  { key: 'contractor', label: 'Contractor' },
  { key: 'visaType', label: 'Visa type' },
  { key: 'workingRight', label: 'Working right' },
  ...DOCUMENT_TYPES.map(({ key, label }) => ({ key, label })),
]

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { projects, clients, employees, contractors, unassignEmployeeFromProject, setProjectEmployees } =
    useAppData()
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(TOGGLEABLE_COLUMNS.map((c) => c.key)),
  )

  const project = projects.find((p) => p.id === projectId)

  if (!project) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeftIcon /> Back to projects
        </Button>
      </div>
    )
  }

  const client = clients.find((c) => c.id === project.clientId)
  const assignedEmployees = employees.filter((e) => project.employeeIds.includes(e.id))

  function contractorName(contractorId: string) {
    return contractors.find((c) => c.id === contractorId)?.name ?? '—'
  }

  function toggleColumn(key: string) {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleAssignSubmit(employeeIds: string[]) {
    if (!project) return
    await setProjectEmployees(project.id, employeeIds)
    toast.success('Assignments updated')
    setAssignDialogOpen(false)
  }

  async function handleRemove(employeeId: string) {
    if (!project) return
    await unassignEmployeeFromProject(project.id, employeeId)
    toast.success('Employee removed')
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

  async function handleExport() {
    if (!project) return
    if (assignedEmployees.length === 0) {
      toast.error('Assign at least one employee before exporting')
      return
    }
    await exportProjectExcel(project, assignedEmployees, contractors, visibleColumns)
    toast.success('Excel file downloaded')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" /> Back to projects
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-medium text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {client?.name ?? '—'}
            {project.siteAddress ? ` · ${project.siteAddress}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <Button onClick={() => setAssignDialogOpen(true)} disabled={employees.length === 0}>
              <UsersIcon /> Assign employees
            </Button>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Assign employees</DialogTitle>
              </DialogHeader>
              <AssignEmployeesForm
                contractors={contractors}
                employees={employees}
                initiallyAssignedIds={project.employeeIds}
                onSubmit={handleAssignSubmit}
                onCancel={() => setAssignDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <Columns3Icon /> Toggle columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              {TOGGLEABLE_COLUMNS.map(({ key, label }) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={visibleColumns.has(key)}
                  onCheckedChange={() => toggleColumn(key)}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleExport} variant="outline">
            <DownloadIcon /> Export to Excel
          </Button>
        </div>
      </div>

      {employees.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No employees exist yet. Add employees first, then assign them here.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {assignedEmployees.length} employee{assignedEmployees.length === 1 ? '' : 's'} assigned
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedEmployees.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {employees.length === 0
                ? 'No employees to assign yet.'
                : 'No employees assigned yet. Click "Assign employees" to add some.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {visibleColumns.has('contractor') && <TableHead>Contractor</TableHead>}
                  {visibleColumns.has('visaType') && <TableHead>Visa type</TableHead>}
                  {visibleColumns.has('workingRight') && <TableHead>Working right</TableHead>}
                  {DOCUMENT_TYPES.map(
                    ({ key, label }) =>
                      visibleColumns.has(key) && <TableHead key={key}>{label}</TableHead>,
                  )}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedEmployees.map((employee) => (
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
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemove(employee.id)}
                      >
                        <XIcon />
                      </Button>
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
