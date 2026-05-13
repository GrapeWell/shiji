import type { ExpenseRecord } from 'types'
import { atomWithStorage } from 'jotai/utils'
import { storage } from './storage'

export const expenseRecordsAtom = atomWithStorage<ExpenseRecord[]>(
  'expenseRecords',
  [],
  storage,
)
