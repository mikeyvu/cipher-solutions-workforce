import { get, set, del } from 'idb-keyval';
import { appStore } from './db';
import { pdfKey } from './keys';
import { DOCUMENT_TYPES, type DocumentType } from '@/types';

export async function savePdf(employeeId: string, docType: DocumentType, file: File): Promise<void> {
  await set(pdfKey(employeeId, docType), file, appStore);
}

export async function getPdf(employeeId: string, docType: DocumentType): Promise<File | undefined> {
  return get<File>(pdfKey(employeeId, docType), appStore);
}

export async function deletePdf(employeeId: string, docType: DocumentType): Promise<void> {
  await del(pdfKey(employeeId, docType), appStore);
}

export async function deleteAllDocumentsForEmployee(employeeId: string): Promise<void> {
  await Promise.all(DOCUMENT_TYPES.map(({ key }) => deletePdf(employeeId, key)));
}
