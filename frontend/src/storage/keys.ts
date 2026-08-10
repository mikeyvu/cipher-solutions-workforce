import type { DocumentType } from '@/types';

export const COLLECTION_KEYS = {
  contractors: 'contractors',
  employees: 'employees',
  clients: 'clients',
  projects: 'projects',
} as const;

export type CollectionName = keyof typeof COLLECTION_KEYS;

export function pdfKey(employeeId: string, docType: DocumentType): string {
  return `pdf:${employeeId}:${docType}`;
}
