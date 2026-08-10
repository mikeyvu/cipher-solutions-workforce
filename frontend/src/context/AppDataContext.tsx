import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Client, Contractor, DocumentMeta, Employee, Project } from '@/types';
import { DOCUMENT_TYPES } from '@/types';
import { getCollection, saveCollection } from '@/storage/collections';
import { deleteAllDocumentsForEmployee, savePdf } from '@/storage/pdfStorage';
import { migrateEmployeeDocuments } from '@/storage/migrateEmployeeDocuments';
import { generateId } from '@/utils/id';
import {
  AppDataContext,
  type AppDataContextValue,
  type EmployeeFiles,
  type NewClient,
  type NewContractor,
  type NewEmployee,
  type NewProject,
} from './AppDataContextObject';

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    const [c, rawEmployees, cl, p] = await Promise.all([
      getCollection<Contractor>('contractors'),
      getCollection<Employee>('employees'),
      getCollection<Client>('clients'),
      getCollection<Project>('projects'),
    ]);
    const { employees: e, migrated } = await migrateEmployeeDocuments(rawEmployees);
    if (migrated) {
      await saveCollection('employees', e);
    }
    setContractors(c);
    setEmployees(e);
    setClients(cl);
    setProjects(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      void navigator.storage.persist();
    }
    void reloadAll();
  }, [reloadAll]);

  const addContractor = useCallback(async (input: NewContractor) => {
    const next: Contractor = { ...input, id: generateId(), createdAt: new Date().toISOString() };
    const updated = [...contractors, next];
    setContractors(updated);
    await saveCollection('contractors', updated);
  }, [contractors]);

  const updateContractor = useCallback(async (id: string, input: NewContractor) => {
    const updated = contractors.map((c) => (c.id === id ? { ...c, ...input } : c));
    setContractors(updated);
    await saveCollection('contractors', updated);
  }, [contractors]);

  const deleteContractor = useCallback(async (id: string) => {
    const employeesToDelete = employees.filter((e) => e.contractorId === id);
    const remainingEmployees = employees.filter((e) => e.contractorId !== id);
    const remainingContractors = contractors.filter((c) => c.id !== id);
    const deletedEmployeeIds = new Set(employeesToDelete.map((e) => e.id));
    const updatedProjects = projects.map((p) => ({
      ...p,
      employeeIds: p.employeeIds.filter((eid) => !deletedEmployeeIds.has(eid)),
    }));

    setContractors(remainingContractors);
    setEmployees(remainingEmployees);
    setProjects(updatedProjects);

    await Promise.all([
      saveCollection('contractors', remainingContractors),
      saveCollection('employees', remainingEmployees),
      saveCollection('projects', updatedProjects),
      ...employeesToDelete.map((e) => deleteAllDocumentsForEmployee(e.id)),
    ]);
  }, [contractors, employees, projects]);

  async function buildDocuments(
    id: string,
    input: NewEmployee,
    files: EmployeeFiles | undefined,
    previous: Employee['documents'] | undefined,
  ): Promise<Employee['documents']> {
    const documents: Employee['documents'] = {};
    for (const { key } of DOCUMENT_TYPES) {
      const file = files?.[key];
      const expiryDate = input.documentExpiry?.[key];
      if (file) {
        await savePdf(id, key, file);
        const meta: DocumentMeta = {
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          expiryDate,
        };
        documents[key] = meta;
      } else if (previous?.[key]) {
        documents[key] = { ...previous[key], expiryDate };
      }
    }
    return documents;
  }

  const addEmployee = useCallback(async (input: NewEmployee, files?: EmployeeFiles) => {
    const id = generateId();
    const { documentExpiry: _documentExpiry, ...rest } = input;
    const documents = await buildDocuments(id, input, files, undefined);
    const next: Employee = { ...rest, id, createdAt: new Date().toISOString(), documents };
    const updated = [...employees, next];
    setEmployees(updated);
    await saveCollection('employees', updated);
  }, [employees]);

  const updateEmployee = useCallback(async (id: string, input: NewEmployee, files?: EmployeeFiles) => {
    const existing = employees.find((e) => e.id === id);
    const { documentExpiry: _documentExpiry, ...rest } = input;
    const documents = await buildDocuments(id, input, files, existing?.documents);
    const updated = employees.map((e) => (e.id === id ? { ...e, ...rest, documents } : e));
    setEmployees(updated);
    await saveCollection('employees', updated);
  }, [employees]);

  const deleteEmployee = useCallback(async (id: string) => {
    const remainingEmployees = employees.filter((e) => e.id !== id);
    const updatedProjects = projects.map((p) => ({
      ...p,
      employeeIds: p.employeeIds.filter((eid) => eid !== id),
    }));

    setEmployees(remainingEmployees);
    setProjects(updatedProjects);

    await Promise.all([
      saveCollection('employees', remainingEmployees),
      saveCollection('projects', updatedProjects),
      deleteAllDocumentsForEmployee(id),
    ]);
  }, [employees, projects]);

  const addClient = useCallback(async (input: NewClient) => {
    const next: Client = { ...input, id: generateId(), createdAt: new Date().toISOString() };
    const updated = [...clients, next];
    setClients(updated);
    await saveCollection('clients', updated);
  }, [clients]);

  const updateClient = useCallback(async (id: string, input: NewClient) => {
    const updated = clients.map((c) => (c.id === id ? { ...c, ...input } : c));
    setClients(updated);
    await saveCollection('clients', updated);
  }, [clients]);

  const deleteClient = useCallback(async (id: string) => {
    const remainingClients = clients.filter((c) => c.id !== id);
    const remainingProjects = projects.filter((p) => p.clientId !== id);

    setClients(remainingClients);
    setProjects(remainingProjects);

    await Promise.all([
      saveCollection('clients', remainingClients),
      saveCollection('projects', remainingProjects),
    ]);
  }, [clients, projects]);

  const addProject = useCallback(async (input: NewProject) => {
    const next: Project = { ...input, id: generateId(), employeeIds: [], createdAt: new Date().toISOString() };
    const updated = [...projects, next];
    setProjects(updated);
    await saveCollection('projects', updated);
  }, [projects]);

  const updateProject = useCallback(async (id: string, input: NewProject) => {
    const updated = projects.map((p) => (p.id === id ? { ...p, ...input } : p));
    setProjects(updated);
    await saveCollection('projects', updated);
  }, [projects]);

  const deleteProject = useCallback(async (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    await saveCollection('projects', updated);
  }, [projects]);

  const assignEmployeeToProject = useCallback(async (projectId: string, employeeId: string) => {
    const updated = projects.map((p) =>
      p.id === projectId && !p.employeeIds.includes(employeeId)
        ? { ...p, employeeIds: [...p.employeeIds, employeeId] }
        : p,
    );
    setProjects(updated);
    await saveCollection('projects', updated);
  }, [projects]);

  const unassignEmployeeFromProject = useCallback(async (projectId: string, employeeId: string) => {
    const updated = projects.map((p) =>
      p.id === projectId ? { ...p, employeeIds: p.employeeIds.filter((id) => id !== employeeId) } : p,
    );
    setProjects(updated);
    await saveCollection('projects', updated);
  }, [projects]);

  const setProjectEmployees = useCallback(async (projectId: string, employeeIds: string[]) => {
    const updated = projects.map((p) => (p.id === projectId ? { ...p, employeeIds } : p));
    setProjects(updated);
    await saveCollection('projects', updated);
  }, [projects]);

  const value = useMemo<AppDataContextValue>(() => ({
    loading,
    contractors,
    employees,
    clients,
    projects,
    addContractor,
    updateContractor,
    deleteContractor,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addClient,
    updateClient,
    deleteClient,
    addProject,
    updateProject,
    deleteProject,
    assignEmployeeToProject,
    unassignEmployeeFromProject,
    setProjectEmployees,
    reloadAll,
  }), [
    loading, contractors, employees, clients, projects,
    addContractor, updateContractor, deleteContractor,
    addEmployee, updateEmployee, deleteEmployee,
    addClient, updateClient, deleteClient,
    addProject, updateProject, deleteProject,
    assignEmployeeToProject, unassignEmployeeFromProject, setProjectEmployees,
    reloadAll,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
