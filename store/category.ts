import type { Category } from 'types'
import { defaultCategories } from 'constants/categories'
import { atomWithStorage } from 'jotai/utils'
import { storage } from './storage'

export const categoriesAtom = atomWithStorage<Category[]>(
  'categories',
  defaultCategories,
  storage,
)
