import dayjs from 'dayjs'

type HolidayType = 'public_holiday' | 'transfer_workday'

interface HolidayEntry {
  date: string
  name: string
  name_cn: string
  name_en: string
  type: HolidayType
}

interface HolidayCalendarData {
  year: number
  region: string
  dates: HolidayEntry[]
}

interface HolidayCellInfo {
  type: HolidayType
  label: string
  name: string
  showName: boolean
}

const holidayCalendar = require('./date.json') as HolidayCalendarData

const holidayByDate = new Map<string, HolidayCellInfo>()

const sortedEntries = [...holidayCalendar.dates].sort((left, right) => left.date.localeCompare(right.date))

const entryByDate = new Map<string, HolidayEntry>()
for (const entry of sortedEntries) {
  entryByDate.set(entry.date, entry)
}

for (const entry of sortedEntries) {
  const previousDay = dayjs(entry.date).subtract(1, 'day').format('YYYY-MM-DD')
  const previousEntry = entryByDate.get(previousDay)
  const isHolidayStart = entry.type === 'public_holiday'
    && (
      !previousEntry
      || previousEntry.type !== 'public_holiday'
      || previousEntry.name_cn !== entry.name_cn
    )

  holidayByDate.set(entry.date, {
    type: entry.type,
    label: entry.type === 'public_holiday' ? '休' : '班',
    name: entry.name_cn || entry.name,
    showName: entry.type === 'public_holiday' ? isHolidayStart : false,
  })
}

export function getHolidayCellInfo(date: string): HolidayCellInfo | null {
  return holidayByDate.get(date) ?? null
}
