import { useState } from 'react'
import { toast } from 'sonner'
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { ContractorForm, type ContractorFormValues } from '@/components/forms/ContractorForm'
import { useAppData } from '@/hooks/useAppData'
import type { Contractor } from '@/types'

export function ContractorsPage() {
  const { contractors, addContractor, updateContractor, deleteContractor } = useAppData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Contractor | undefined>(undefined)

  function openCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(contractor: Contractor) {
    setEditing(contractor)
    setDialogOpen(true)
  }

  async function handleSubmit(values: ContractorFormValues) {
    if (editing) {
      await updateContractor(editing.id, values)
      toast.success('Contractor updated')
    } else {
      await addContractor(values)
      toast.success('Contractor added')
    }
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    await deleteContractor(id)
    toast.success('Contractor deleted')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-medium text-foreground">Contractors</h1>
          <p className="text-sm text-muted-foreground">Sub-contractors that supply employees.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={openCreate}>
            <PlusIcon /> Add contractor
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit contractor' : 'Add contractor'}</DialogTitle>
            </DialogHeader>
            <ContractorForm
              initial={editing}
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {contractors.length} contractor{contractors.length === 1 ? '' : 's'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contractors.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No contractors yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractors.map((contractor) => (
                  <TableRow key={contractor.id}>
                    <TableCell className="font-medium">{contractor.name}</TableCell>
                    <TableCell>{contractor.contactName || '—'}</TableCell>
                    <TableCell>{contractor.contactEmail || '—'}</TableCell>
                    <TableCell>{contractor.contactPhone || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(contractor)}>
                          <PencilIcon />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            <TrashIcon />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {contractor.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This also deletes all of this contractor's employees and their visa
                                documents, and removes them from any project assignments. This cannot
                                be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => handleDelete(contractor.id)}
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
