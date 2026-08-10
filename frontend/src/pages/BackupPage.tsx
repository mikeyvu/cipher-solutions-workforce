import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { DownloadIcon, UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppData } from '@/hooks/useAppData'
import { exportAllDataAsJson, importDataFromJson } from '@/storage/backup'

export function BackupPage() {
  const { reloadAll } = useAppData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | undefined>(undefined)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleExport() {
    try {
      await exportAllDataAsJson()
      toast.success('Backup downloaded')
    } catch {
      toast.error('Failed to export backup')
    }
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPendingFile(file)
      setConfirmOpen(true)
    }
  }

  async function handleConfirmImport() {
    if (!pendingFile) return
    try {
      await importDataFromJson(pendingFile)
      await reloadAll()
      toast.success('Backup restored')
    } catch {
      toast.error('Failed to import backup — check the file is a valid Cipher Solutions backup')
    } finally {
      setPendingFile(undefined)
      setConfirmOpen(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-medium text-foreground">Backup</h1>
        <p className="text-sm text-muted-foreground">
          All data lives only in this browser. Export a backup regularly as insurance against data loss.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export backup</CardTitle>
          <CardDescription>
            Downloads a JSON file containing all contractors, employees, clients, projects, and employee
            documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport}>
            <DownloadIcon /> Export all data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import backup</CardTitle>
          <CardDescription>
            Restores data from a previously exported backup file. This overwrites all current data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon /> Choose backup file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFilePicked}
          />
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite current data?</AlertDialogTitle>
            <AlertDialogDescription>
              Importing "{pendingFile?.name}" will replace all contractors, employees, clients, projects,
              and employee documents currently stored in this browser. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingFile(undefined)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmImport}>
              Import and overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
