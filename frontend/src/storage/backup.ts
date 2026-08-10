import type { AppData, DocumentType, Employee } from '@/types';
import { DOCUMENT_TYPES } from '@/types';
import { getCollection, saveCollection } from './collections';
import { getPdf, savePdf } from './pdfStorage';

interface BackupPdfEntry {
  fileName: string;
  mimeType: string;
  dataBase64: string;
}

interface BackupFileV1 {
  version: 1;
  exportedAt: string;
  data: AppData;
  pdfs: Record<string, BackupPdfEntry>;
}

interface BackupFileV2 {
  version: 2;
  exportedAt: string;
  data: AppData;
  pdfs: Record<string, BackupPdfEntry>;
}

type BackupFile = BackupFileV1 | BackupFileV2;

function docPdfKey(employeeId: string, docType: DocumentType): string {
  return `${employeeId}:${docType}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export async function exportAllDataAsJson(): Promise<void> {
  const [contractors, employees, clients, projects] = await Promise.all([
    getCollection<AppData['contractors'][number]>('contractors'),
    getCollection<Employee>('employees'),
    getCollection<AppData['clients'][number]>('clients'),
    getCollection<AppData['projects'][number]>('projects'),
  ]);

  const pdfs: BackupFileV2['pdfs'] = {};
  for (const employee of employees) {
    for (const { key: docType } of DOCUMENT_TYPES) {
      const meta = employee.documents[docType];
      if (!meta) continue;
      const file = await getPdf(employee.id, docType);
      if (!file) continue;
      const buffer = await file.arrayBuffer();
      pdfs[docPdfKey(employee.id, docType)] = {
        fileName: meta.fileName,
        mimeType: meta.mimeType,
        dataBase64: arrayBufferToBase64(buffer),
      };
    }
  }

  const backup: BackupFileV2 = {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: { contractors, employees, clients, projects },
    pdfs,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cipher-solutions-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importDataFromJson(file: File): Promise<void> {
  const text = await file.text();
  const backup = JSON.parse(text) as BackupFile;

  if ((backup.version !== 1 && backup.version !== 2) || !backup.data) {
    throw new Error('Invalid backup file format.');
  }

  await Promise.all([
    saveCollection('contractors', backup.data.contractors),
    saveCollection('employees', backup.data.employees),
    saveCollection('clients', backup.data.clients),
    saveCollection('projects', backup.data.projects),
  ]);

  if (backup.version === 1) {
    for (const [employeeId, pdf] of Object.entries(backup.pdfs)) {
      const blob = base64ToBlob(pdf.dataBase64, pdf.mimeType);
      const restoredFile = new File([blob], pdf.fileName, { type: pdf.mimeType });
      await savePdf(employeeId, 'visa', restoredFile);
    }
    return;
  }

  for (const [key, pdf] of Object.entries(backup.pdfs)) {
    const [employeeId, docType] = key.split(':') as [string, DocumentType];
    const blob = base64ToBlob(pdf.dataBase64, pdf.mimeType);
    const restoredFile = new File([blob], pdf.fileName, { type: pdf.mimeType });
    await savePdf(employeeId, docType, restoredFile);
  }
}
