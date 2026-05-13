import type { AppSettings } from 'types'
import { atomWithStorage } from 'jotai/utils'
import { storage } from './storage'

export const settingsAtom = atomWithStorage<AppSettings>(
  'settings',
  {
    defaultHourlyRate: 100,
    currency: 'CNY',
    weekStart: 1,
  },
  storage,
)
