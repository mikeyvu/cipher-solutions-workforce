import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PlusIcon, PencilIcon, TrashIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ProjectForm, type ProjectFormValues } from '@/components/forms/ProjectForm'
import { useAppData } from '@/hooks/useAppData'
import type { Project } from '@/types'

export function ProjectsPage() {
  const { projects, clients, addProject, updateProject, deleteProject } = useAppData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | undefined>(undefined)

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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {projects.length} project{projects.length === 1 ? '' : 's'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects yet. Add one to get started.
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
                {projects.map((project) => (
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
        </CardContent>
      </Card>
    </div>
  )
}
