import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PlusIcon, PencilIcon, TrashIcon, ArrowRightIcon, ListFilterIcon, SearchIcon, XIcon } from 'lucide-react'
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
import { ProjectForm, type ProjectFormValues } from '@/components/forms/ProjectForm'
import { useAppData } from '@/hooks/useAppData'
import { getPageNumbers } from '@/lib/pagination'
import type { Project } from '@/types'

const PAGE_SIZE = 10

export function ProjectsPage() {
  const { projects, clients, addProject, updateProject, deleteProject } = useAppData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | undefined>(undefined)
  const [clientFilter, setClientFilter] = useState('all')
  const [search, setSearch] = useState('')

  const clientFilterItems = useMemo<Record<string, string>>(
    () => ({ all: 'All', ...Object.fromEntries(clients.map((c) => [c.id, c.name])) }),
    [clients],
  )

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase()
    return projects.filter((project) => {
      if (term && !project.name.toLowerCase().includes(term)) return false
      if (clientFilter !== 'all' && project.clientId !== clientFilter) return false
      return true
    })
  }, [projects, clientFilter, search])

  const [currentPage, setCurrentPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE))
  const pagedProjects = filteredProjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [clientFilter, search])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount))
  }, [pageCount])

  function clearFilters() {
    setClientFilter('all')
    setSearch('')
  }

  function clientName(clientId: string) {
    return clients.find((c) => c.id === clientId)?.name ?? '—'
  }

  function openCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(project: Project) {
    setEditing(project)
    setDialogOpen(true)
  }

  async function handleSubmit(values: ProjectFormValues) {
    if (editing) {
      await updateProject(editing.id, values)
      toast.success('Project updated')
    } else {
      await addProject(values)
      toast.success('Project added')
    }
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    await deleteProject(id)
    toast.success('Project deleted')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-medium text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">Client sites employees are assigned to.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={openCreate} disabled={clients.length === 0}>
            <PlusIcon /> Add project
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit project' : 'Add project'}</DialogTitle>
            </DialogHeader>
            <ProjectForm
              initial={editing}
              clients={clients}
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 && (
        <p className="text-sm text-muted-foreground">Add a client first before you can add projects.</p>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-8"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <ListFilterIcon />
            Filters{clientFilter !== 'all' ? ' (1)' : ''}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Client</span>
              <Select
                items={clientFilterItems}
                value={clientFilter}
                onValueChange={(value) => setClientFilter(value as string)}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(clientFilterItems).map((value) => (
                    <SelectItem key={value} value={value}>
                      {clientFilterItems[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {(clientFilter !== 'all' || search.trim() !== '') && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon /> Clear all
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {filteredProjects.length} of {projects.length} project{projects.length === 1 ? '' : 's'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects yet. Add one to get started.
            </p>
          ) : filteredProjects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects match the current filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Site address</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{clientName(project.clientId)}</TableCell>
                    <TableCell>{project.siteAddress || '—'}</TableCell>
                    <TableCell>{project.employeeIds.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          render={<Link to={`/projects/${project.id}`} />}
                        >
                          <ArrowRightIcon />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(project)}>
                          <PencilIcon />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            <TrashIcon />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the project and its employee assignments. This cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(project.id)}
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
