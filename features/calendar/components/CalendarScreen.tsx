import type { Category, ExpenseRecord, WorkRecord } from 'types'
import { getHolidayCellInfo } from 'constants/holiday'
import dayjs from 'dayjs'
import { useAtom, useAtomValue } from 'jotai'
import { useMemo, useState } from 'react'
import { Pressable, View as RNView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { categoriesAtom } from 'store/category'
import { expenseRecordsAtom } from 'store/expense'
import { settingsAtom } from 'store/settings'
import { workRecordsAtom } from 'store/work'
import { Button, Text, View, XStack, YStack } from 'tamagui'
import { DateDetailPanel } from './DateDetailPanel'

const WEEKDAY_LABELS = [
  ['日', '一', '二', '三', '四', '五', '六'],
  ['一', '二', '三', '四', '五', '六', '日'],
]

interface DayCellData {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  hasWork: boolean
  workHours: number
  holidayLabel: string
  holidayName: string
  holidayShowName: boolean
  holidayType: 'public_holiday' | 'transfer_workday' | null
  expenseColors: string[]
}

function formatWorkHours(hours: number): string {
  if (hours <= 0)
    return ''

  const rounded = Math.round(hours * 10) / 10
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}h`
}

function buildMonthGrid(
  year: number,
  month: number,
  weekStart: 0 | 1,
  workDates: Set<string>,
  workHoursByDate: Map<string, number>,
  expenseByDate: Map<string, string[]>,
): DayCellData[][] {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`)
  const daysInMonth = firstDay.daysInMonth()
  const today = dayjs().format('YYYY-MM-DD')

  const jsWeekday = firstDay.day()
  const offset = weekStart === 1
    ? (jsWeekday + 6) % 7
    : jsWeekday

  const totalCells = offset + daysInMonth
  const totalWeeks = Math.ceil(totalCells / 7)
  const cells: DayCellData[] = []

  for (let i = 0; i < totalWeeks * 7; i++) {
    if (i < offset || i >= offset + daysInMonth) {
      cells.push({
        date: '',
        day: 0,
        isCurrentMonth: false,
        isToday: false,
        hasWork: false,
        workHours: 0,
        holidayLabel: '',
        holidayName: '',
        holidayShowName: false,
        holidayType: null,
        expenseColors: [],
      })
      continue
    }

    const day = i - offset + 1
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const holiday = getHolidayCellInfo(date)

    cells.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: date === today,
      hasWork: workDates.has(date),
      workHours: workHoursByDate.get(date) ?? 0,
      holidayLabel: holiday?.label ?? '',
      holidayName: holiday?.name ?? '',
      holidayShowName: holiday?.showName ?? false,
      holidayType: holiday?.type ?? null,
      expenseColors: expenseByDate.get(date) ?? [],
    })
  }

  const rows: DayCellData[][] = []
  for (let r = 0; r < totalWeeks; r++) {
    rows.push(cells.slice(r * 7, (r + 1) * 7))
  }
  return rows
}

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const insets = useSafeAreaInsets()

  const workRecords = useAtomValue(workRecordsAtom)
  const expenseRecords = useAtomValue(expenseRecordsAtom)
  const categories = useAtomValue(categoriesAtom)
  const settings = useAtomValue(settingsAtom)
  const [, setWorkRecords] = useAtom(workRecordsAtom)
  const [, setExpenseRecords] = useAtom(expenseRecordsAtom)

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>()
    for (const cat of categories) {
      map.set(cat.id, cat)
    }
    return map
  }, [categories])

  const { workDates, workHoursByDate, expenseByDate } = useMemo(() => {
    const wd = new Set<string>()
    const wh = new Map<string, number>()
    const em = new Map<string, string[]>()

    const wr = Array.isArray(workRecords) ? workRecords : []
    for (const r of wr) {
      wd.add(r.date)
      wh.set(r.date, (wh.get(r.date) ?? 0) + r.durationHours)
    }

    const er = Array.isArray(expenseRecords) ? expenseRecords : []
    for (const r of er) {
      const colors = em.get(r.date) ?? []
      const cat = categoryMap.get(r.categoryId)
      const color = cat?.color ?? '#888'
      if (!colors.includes(color)) {
        colors.push(color)
      }
      em.set(r.date, colors)
    }

    return { workDates: wd, workHoursByDate: wh, expenseByDate: em }
  }, [workRecords, expenseRecords, categoryMap])

  const weeks = useMemo(
    () => buildMonthGrid(
      currentMonth.year(),
      currentMonth.month() + 1,
      settings.weekStart,
      workDates,
      workHoursByDate,
      expenseByDate,
    ),
    [currentMonth, settings.weekStart, workDates, workHoursByDate, expenseByDate],
  )

  const weekdayLabels = WEEKDAY_LABELS[settings.weekStart]

  const goToPrevMonth = () => setCurrentMonth(prev => prev.subtract(1, 'month'))
  const goToNextMonth = () => setCurrentMonth(prev => prev.add(1, 'month'))
  const goToToday = () => {
    setCurrentMonth(dayjs())
    setSelectedDate(dayjs().format('YYYY-MM-DD'))
  }

  const handleDatePress = (cell: DayCellData) => {
    if (!cell.isCurrentMonth)
      return
    setSelectedDate(cell.date)
  }

  const selectedRecords = useMemo(() => {
    if (!selectedDate)
      return { workRecords: [] as WorkRecord[], expenseRecords: [] as ExpenseRecord[] }
    const wr = Array.isArray(workRecords) ? workRecords : []
    const er = Array.isArray(expenseRecords) ? expenseRecords : []
    return {
      workRecords: wr.filter(r => r.date === selectedDate),
      expenseRecords: er.filter(r => r.date === selectedDate),
    }
  }, [selectedDate, workRecords, expenseRecords])

  const handleAddWorkRecord = (record: WorkRecord) => {
    const current = Array.isArray(workRecords) ? workRecords : []
    setWorkRecords([...current, record])
  }

  const handleDeleteWorkRecord = (id: string) => {
    const current = Array.isArray(workRecords) ? workRecords : []
    setWorkRecords(current.filter(r => r.id !== id))
  }

  const handleAddExpenseRecord = (record: ExpenseRecord) => {
    const current = Array.isArray(expenseRecords) ? expenseRecords : []
    setExpenseRecords([...current, record])
  }

  const handleDeleteExpenseRecord = (id: string) => {
    const current = Array.isArray(expenseRecords) ? expenseRecords : []
    setExpenseRecords(current.filter(r => r.id !== id))
  }

  return (
    <View flex={1} bg="$background">
      {/* Fixed Calendar Header */}
      <YStack
        pt={insets.top + 16}
        bg="$background"
      >
        {/* Month Navigator */}
        <XStack
          items="center"
          justify="space-between"
          px="$4"
          pb="$2"
        >
          <Button
            size="$3"
            chromeless
            onPress={goToPrevMonth}
          >
            ◀
          </Button>
          <XStack items="center" gap="$2">
            <Text fontSize="$6" fontWeight="700">
              {currentMonth.year()}
              年
              {currentMonth.month() + 1}
              月
            </Text>
            <Button
              size="$2"
              chromeless
              onPress={goToToday}
            >
              今天
            </Button>
          </XStack>
          <Button
            size="$3"
            chromeless
            onPress={goToNextMonth}
          >
            ▶
          </Button>
        </XStack>

        {/* Weekday Header */}
        <XStack px="$2" py="$2">
          {weekdayLabels.map(label => (
            <YStack key={label} flex={1} items="center">
              <Text
                fontSize="$3"
                fontWeight="600"
                color={
                  (label === '日' || label === '六')
                    ? '$red10'
                    : '$color10'
                }
              >
                {label}
              </Text>
            </YStack>
          ))}
        </XStack>

        {/* Date Grid */}
        <YStack px="$2" gap={2}>
          {weeks.map((week, wi) => (
            <XStack key={wi} gap={2}>
              {week.map((cell, ci) => {
                const isSelected = cell.date === selectedDate
                const cellBg = isSelected
                  ? '$blue5'
                  : cell.isToday
                    ? '$blue2'
                    : 'transparent'

                return (
                  <Pressable
                    key={ci}
                    onPress={() => handleDatePress(cell)}
                    style={{ flex: 1 }}
                  >
                    <YStack
                      height={60}
                      items="center"
                      justify="center"
                      rounded="$3"
                      bg={cellBg as any}
                      borderWidth={cell.isToday && !isSelected ? 1 : 0}
                      borderColor={cell.isToday && !isSelected ? '$blue8' : undefined}
                      opacity={cell.isCurrentMonth ? 1 : 0.3}
                      gap={2}
                    >
                      {cell.day > 0 && (
                        <>
                          <YStack items="center" gap={1.5}>
                            <XStack items="center" gap={2}>
                              {cell.holidayLabel && (
                                <Text
                                  fontSize={10}
                                  fontWeight="700"
                                  lineHeight={12}
                                  color={cell.holidayType === 'transfer_workday' ? '#ef6c00' : '#d32f2f'}
                                >
                                  {cell.holidayLabel}
                                </Text>
                              )}
                              {!cell.holidayLabel && (
                                <View width={10} />
                              )}
                              <Text
                                fontSize={cell.isToday ? 16 : 15}
                                fontWeight={cell.isToday ? '700' : '400'}
                                color={
                                  isSelected
                                    ? '$blue10'
                                    : cell.isToday
                                      ? '$blue10'
                                      : '$color'
                                }
                              >
                                {cell.day}
                              </Text>
                              {cell.holidayShowName && cell.holidayName && (
                                <YStack items="center" gap={0}>
                                  {cell.holidayName.split('').map((char, index) => (
                                    <Text
                                      key={`${cell.date}-${index}`}
                                      fontSize={8}
                                      lineHeight={9}
                                      color="$color10"
                                    >
                                      {char}
                                    </Text>
                                  ))}
                                </YStack>
                              )}
                              {!cell.holidayName && (
                                <View width={10} />
                              )}
                            </XStack>
                            {cell.hasWork && (
                              <Text
                                fontSize={10}
                                fontWeight="600"
                                color={isSelected ? '$blue10' : '$blue9'}
                                lineHeight={12}
                              >
                                {formatWorkHours(cell.workHours)}
                              </Text>
                            )}
                            {cell.expenseColors.length > 0 && (
                              <XStack gap={3} items="center">
                                {cell.expenseColors.slice(0, 3).map((color, i) => (
                                  <RNView
                                    key={i}
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: 3,
                                      backgroundColor: color,
                                    }}
                                  />
                                ))}
                                {cell.expenseColors.length > 3 && (
                                  <Text fontSize={8} color="$color10">
                                    +
                                    {cell.expenseColors.length - 3}
                                  </Text>
                                )}
                              </XStack>
                            )}
                          </YStack>
                        </>
                      )}
                    </YStack>
                  </Pressable>
                )
              })}
            </XStack>
          ))}
        </YStack>

      </YStack>

      {/* Scrollable Records Section */}
      {selectedDate && (
        <DateDetailPanel
          date={selectedDate}
          workRecords={selectedRecords.workRecords}
          expenseRecords={selectedRecords.expenseRecords}
          categories={categories}
          onAddWorkRecord={handleAddWorkRecord}
          onDeleteWorkRecord={handleDeleteWorkRecord}
          onAddExpenseRecord={handleAddExpenseRecord}
          onDeleteExpenseRecord={handleDeleteExpenseRecord}
        />
      )}
    </View>
  )
}
