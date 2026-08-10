import { DOCUMENT_TYPES, type DocumentType, type Employee } from '@/types'

export type DocFilterValue = 'all' | 'have' | 'not_have'

export const DOC_FILTER_OPTIONS: Record<DocFilterValue, string> = {
  all: 'All',
  have: 'Have',
  not_have: 'Not have',
}

export function emptyDocumentFilters(): Record<DocumentType, DocFilterValue> {
  return Object.fromEntries(DOCUMENT_TYPES.map(({ key }) => [key, 'all'])) as Record<
    DocumentType,
    DocFilterValue
  >
}

export function matchesDocumentFilters(
  employee: Employee,
  filters: Record<DocumentType, DocFilterValue>,
): boolean {
  return DOCUMENT_TYPES.every(({ key }) => {
    const filter = filters[key]
    if (filter === 'all') return true
    const has = Boolean(employee.documents[key])
    return filter === 'have' ? has : !has
  })
}
