import { useState } from 'react'
import { toast } from 'sonner'
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react'
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
import { ClientForm, type ClientFormValues } from '@/components/forms/ClientForm'
import { useAppData } from '@/hooks/useAppData'
import type { Client } from '@/types'

export function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useAppData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Client | undefined>(undefined)

  function openCreate() {
    setEditing(undefined)
    setDialogOpen(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    setDialogOpen(true)
  }

  async function handleSubmit(values: ClientFormValues) {
    if (editing) {
      await updateClient(editing.id, values)
      toast.success('Client updated')
    } else {
      await addClient(values)
      toast.success('Client added')
    }
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    await deleteClient(id)
    toast.success('Client deleted')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-medium text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground">Companies Cipher Solutions runs projects for.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={openCreate}>
            <PlusIcon /> Add client
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit client' : 'Add client'}</DialogTitle>
            </DialogHeader>
            <ClientForm initial={editing} onSubmit={handleSubmit} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            {clients.length} client{clients.length === 1 ? '' : 's'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No clients yet. Add one to get started.
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
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.contactName || '—'}</TableCell>
                    <TableCell>{client.contactEmail || '—'}</TableCell>
                    <TableCell>{client.contactPhone || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(client)}>
                          <PencilIcon />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                            <TrashIcon />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {client.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This also deletes all of this client's projects and their employee
                                assignments. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction variant="destructive" onClick={() => handleDelete(client.id)}>
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
