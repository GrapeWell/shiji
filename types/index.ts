export interface WorkRecord {
  id: string

  /** 日期，格式：2026-05-13 */
  date: string

  /** 工时，8.5 表示 8小时30分钟 */
  durationHours: number

  note?: string

  createdAt: number
  updatedAt: number
}

export interface ExpenseRecord {
  id: string

  /** 日期 */
  date: string

  /** income 收入 / expense 支出 */
  type: 'income' | 'expense'

  /** 分类ID */
  categoryId: string

  /** 金额 */
  amount: number

  note?: string

  createdAt: number
  updatedAt: number
}

export interface Category {
  id: string

  name: string

  /** income 收入 / expense 支出 */
  type: 'income' | 'expense'

  icon?: string

  color?: string

  /** 是否启用 */
  enabled: boolean

  /** 是否默认分类 */
  isDefault?: boolean

  /** 排序 */
  sort: number
}

export interface AppSettings {
  /** 默认时薪 */
  defaultHourlyRate: number

  /** 货币 */
  currency: 'CNY' | 'USD'

  /** 周起始日，0 周日 / 1 周一 */
  weekStart: 0 | 1
}
