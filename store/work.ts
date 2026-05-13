import type { WorkRecord } from 'types'
import { atomWithStorage } from 'jotai/utils'
import { storage } from './storage'

export const workRecordsAtom = atomWithStorage<WorkRecord[]>(
  'workRecords',
  [],
  storage,
)
