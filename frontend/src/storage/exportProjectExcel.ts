import { Workbook, type Borders } from 'exceljs'
import { DOCUMENT_TYPES, type Contractor, type Employee, type Project } from '@/types'

const HEADER_FILL = 'FFC6E0B4'
const THIN_BORDER: Partial<Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
}

export async function exportProjectExcel(
  project: Project,
  assignedEmployees: Employee[],
  contractors: Contractor[],
) {
  const contractorsById = new Map(contractors.map((c) => [c.id, c]))

  const columns = [
    { header: 'Full Name', key: 'fullName' },
    { header: 'Sub-Contractor', key: 'contractor' },
    { header: 'Visa Type', key: 'visaType' },
    { header: 'Working Right', key: 'workingRight' },
    ...DOCUMENT_TYPES.map(({ key, label }) => ({ header: label, key })),
  ]

  const rows = assignedEmployees.map((e) => ({
    fullName: `${e.firstName} ${e.lastName}`,
    contractor: contractorsById.get(e.contractorId)?.name ?? '',
    visaType: e.visaType,
    workingRight: e.workingRight,
    ...Object.fromEntries(DOCUMENT_TYPES.map(({ key }) => [key, e.documents[key] ? '✓' : ''])),
  }))

  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet('Employees')
  worksheet.columns = columns
  worksheet.addRows(rows)

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.font = { bold: true }
  })

  const documentColumnKeys = new Set<string>(DOCUMENT_TYPES.map(({ key }) => key))

  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = THIN_BORDER
      if (documentColumnKeys.has(columns[colNumber - 1].key)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
    })
  })

  worksheet.columns.forEach((column, index) => {
    const def = columns[index]
    let maxLength = def.header.length
    for (const row of rows) {
      const value = row[def.key as keyof typeof row]
      const length = value ? String(value).length : 0
      if (length > maxLength) maxLength = length
    }
    column.width = maxLength + 2
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name.replace(/[^\w-]+/g, '_')}-employees.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
