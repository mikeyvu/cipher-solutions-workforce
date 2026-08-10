import { Workbook, type Borders } from 'exceljs'

const HEADER_FILL = 'FFC6E0B4'
const THIN_BORDER: Partial<Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
}

export interface ExcelColumn {
  header: string
  key: string
}

export async function downloadStyledExcel(
  sheetName: string,
  fileName: string,
  columns: ExcelColumn[],
  rows: Record<string, string>[],
  centeredColumnKeys: Set<string>,
) {
  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet(sheetName)
  worksheet.columns = columns
  worksheet.addRows(rows)

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.font = { bold: true }
  })

  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = THIN_BORDER
      if (centeredColumnKeys.has(columns[colNumber - 1].key)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      }
    })
  })

  worksheet.columns.forEach((column, index) => {
    const def = columns[index]
    let maxLength = def.header.length
    for (const row of rows) {
      const value = row[def.key]
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
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
