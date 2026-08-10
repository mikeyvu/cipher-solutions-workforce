import { DOCUMENT_TYPES } from '@/types'

export const TOGGLEABLE_EMPLOYEE_COLUMNS: { key: string; label: string }[] = [
  { key: 'contractor', label: 'Contractor' },
  { key: 'visaType', label: 'Visa type' },
  { key: 'workingRight', label: 'Working right' },
  ...DOCUMENT_TYPES.map(({ key, label }) => ({ key, label })),
]
