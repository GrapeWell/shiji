import AsyncStorage from '@react-native-async-storage/async-storage'
import { createJSONStorage } from 'jotai/utils'

// JSON serialization boundary: type-tolerance is inherent
export const storage = createJSONStorage<any>(() => AsyncStorage)
