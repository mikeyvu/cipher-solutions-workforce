export interface Contractor {
  id: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
}

export type DocumentType =
  | 'visa'
  | 'ndis'
  | 'workingWithChildrenCheck'
  | 'policeCheck'
  | 'photoId'
  | 'driverLicense';

export const DOCUMENT_TYPES: { key: DocumentType; label: string }[] = [
  { key: 'visa', label: 'Visa' },
  { key: 'ndis', label: 'NDIS' },
  { key: 'workingWithChildrenCheck', label: 'Working with Children Check' },
  { key: 'policeCheck', label: 'Police Check' },
  { key: 'photoId', label: 'Photo ID' },
  { key: 'driverLicense', label: "Driver's License" },
];

export interface DocumentMeta {
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  expiryDate?: string;
}

export interface Employee {
  id: string;
  contractorId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  visaType: string;
  workingRight: string;
  documents: Partial<Record<DocumentType, DocumentMeta>>;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  siteAddress?: string;
  employeeIds: string[];
  createdAt: string;
}

export interface AppData {
  contractors: Contractor[];
  employees: Employee[];
  clients: Client[];
  projects: Project[];
}
