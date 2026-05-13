import type { ExpenseRecord, WorkRecord } from 'types'
import { atom } from 'jotai'
import { workRecordsAtom } from './work'
import { expenseRecordsAtom } from './expense'

function ensureArray<T>(value: T | Promise<T>): T {
  return (Array.isArray(value) ? value : []) as T
}

export const monthlySummaryAtom = atom((get) => {
  const workRecords = ensureArray<WorkRecord[]>(get(workRecordsAtom))
  const expenseRecords = ensureArray<ExpenseRecord[]>(get(expenseRecordsAtom))

  const totalHours = workRecords.reduce(
    (sum, item) => sum + item.durationHours,
    0,
  )

  const totalIncome = expenseRecords
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0)

  const totalExpense = expenseRecords
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0)

  return {
    totalHours,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
  }
})
