import * as XLSX from 'xlsx'
import type { Contractor, Employee, Project } from '@/types'

export function exportProjectExcel(
  project: Project,
  assignedEmployees: Employee[],
  contractors: Contractor[],
) {
  const contractorsById = new Map(contractors.map((c) => [c.id, c]))

  const rows = assignedEmployees.map((e) => ({
    'Full Name': `${e.firstName} ${e.lastName}`,
    'Sub-Contractor': contractorsById.get(e.contractorId)?.name ?? '',
    'Visa Type': e.visaType,
    'Working Right': e.workingRight,
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees')

  const fileName = `${project.name.replace(/[^\w-]+/g, '_')}-employees.xlsx`
  XLSX.writeFile(workbook, fileName)
}
