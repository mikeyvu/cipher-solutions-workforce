import { downloadStyledExcel } from '@/lib/excelExport'
import { DOCUMENT_TYPES, type Contractor, type Employee } from '@/types'

export async function exportEmployeesExcel(
  employees: Employee[],
  contractors: Contractor[],
  visibleColumns: Set<string>,
) {
  const contractorsById = new Map(contractors.map((c) => [c.id, c]))

  const columns = [
    { header: 'Full Name', key: 'fullName' },
    { header: 'Sub-Contractor', key: 'contractor' },
    { header: 'Visa Type', key: 'visaType' },
    { header: 'Working Right', key: 'workingRight' },
    ...DOCUMENT_TYPES.map(({ key, label }) => ({ header: label, key })),
  ].filter((c) => c.key === 'fullName' || visibleColumns.has(c.key))

  const rows = employees.map((e) => ({
    fullName: `${e.firstName} ${e.lastName}`,
    contractor: contractorsById.get(e.contractorId)?.name ?? '',
    visaType: e.visaType,
    workingRight: e.workingRight,
    ...Object.fromEntries(DOCUMENT_TYPES.map(({ key }) => [key, e.documents[key] ? '✓' : ''])),
  }))

  const documentColumnKeys = new Set<string>(DOCUMENT_TYPES.map(({ key }) => key))

  await downloadStyledExcel(
    'Employees',
    `employees-${new Date().toISOString().slice(0, 10)}.xlsx`,
    columns,
    rows,
    documentColumnKeys,
  )
}
