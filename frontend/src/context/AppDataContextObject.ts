import { createContext } from 'react';
import type { Client, Contractor, DocumentType, Employee, Project } from '@/types';

export type NewContractor = Omit<Contractor, 'id' | 'createdAt'>;
export type NewClient = Omit<Client, 'id' | 'createdAt'>;
export type NewProject = Omit<Project, 'id' | 'createdAt' | 'employeeIds'>;
export type NewEmployee = Omit<Employee, 'id' | 'createdAt' | 'documents'> & {
  documentExpiry?: Partial<Record<DocumentType, string>>;
};
export type EmployeeFiles = Partial<Record<DocumentType, File>>;

export interface AppDataContextValue {
  loading: boolean;
  contractors: Contractor[];
  employees: Employee[];
  clients: Client[];
  projects: Project[];

  addContractor: (input: NewContractor) => Promise<void>;
  updateContractor: (id: string, input: NewContractor) => Promise<void>;
  deleteContractor: (id: string) => Promise<void>;

  addEmployee: (input: NewEmployee, files?: EmployeeFiles) => Promise<void>;
  updateEmployee: (id: string, input: NewEmployee, files?: EmployeeFiles) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  addClient: (input: NewClient) => Promise<void>;
  updateClient: (id: string, input: NewClient) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addProject: (input: NewProject) => Promise<void>;
  updateProject: (id: string, input: NewProject) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  assignEmployeeToProject: (projectId: string, employeeId: string) => Promise<void>;
  unassignEmployeeFromProject: (projectId: string, employeeId: string) => Promise<void>;
  setProjectEmployees: (projectId: string, employeeIds: string[]) => Promise<void>;

  reloadAll: () => Promise<void>;
}

export const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);
