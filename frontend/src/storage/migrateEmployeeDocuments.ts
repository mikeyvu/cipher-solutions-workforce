import { get, set, del } from 'idb-keyval';
import { appStore } from './db';
import { pdfKey } from './keys';
import type { DocumentMeta, Employee } from '@/types';

interface LegacyEmployee extends Omit<Employee, 'documents'> {
  documents?: Employee['documents'];
  visaDocument?: DocumentMeta;
}

function legacyPdfKey(employeeId: string): string {
  return `pdf:${employeeId}`;
}

/**
 * Employees saved before per-document-type tracking have a single
 * `visaDocument` field and their file under the old `pdf:{id}` key.
 * Moves them onto `documents.visa` / `pdf:{id}:visa`, idempotently.
 */
export async function migrateEmployeeDocuments(
  employees: Employee[],
): Promise<{ employees: Employee[]; migrated: boolean }> {
  let migrated = false;
  const result: Employee[] = [];

  for (const raw of employees as LegacyEmployee[]) {
    if (raw.documents) {
      result.push(raw as Employee);
      continue;
    }

    migrated = true;
    const { visaDocument, ...rest } = raw;
    const documents: Employee['documents'] = {};

    if (visaDocument) {
      documents.visa = visaDocument;
      const file = await get<File>(legacyPdfKey(raw.id), appStore);
      if (file) {
        await set(pdfKey(raw.id, 'visa'), file, appStore);
        await del(legacyPdfKey(raw.id), appStore);
      }
    }

    result.push({ ...rest, documents });
  }

  return { employees: result, migrated };
}
