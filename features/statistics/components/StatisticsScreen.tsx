import type { Category, ExpenseRecord, WorkRecord } from 'types'
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { useMemo, useState } from 'react'
import { ScrollView, View as RNView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { categoriesAtom } from 'store/category'
import { expenseRecordsAtom } from 'store/expense'
import { settingsAtom } from 'store/settings'
import { workRecordsAtom } from 'store/work'
import { Button, Separator, Text, View, XStack, YStack } from 'tamagui'

type Period = 'week' | 'month' | 'year'

function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}

function getWeekRange(date: dayjs.Dayjs, weekStart: 0 | 1) {
  const currentDay = date.day()
  const offset = (currentDay - weekStart + 7) % 7
  const start = date.subtract(offset, 'day')
  const end = start.add(6, 'day')
  return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') }
}

function getPeriodRange(refDate: dayjs.Dayjs, period: Period, weekStart: 0 | 1) {
  if (period === 'week') {
    const { start, end } = getWeekRange(refDate, weekStart)
    const s = dayjs(start)
    const e = dayjs(end)
    return {
      start,
      end,
      label: `${s.format('M/D')} - ${e.format('M/D')}`,
    }
  }
  if (period === 'month') {
    return {
      start: refDate.startOf('month').format('YYYY-MM-DD'),
      end: refDate.endOf('month').format('YYYY-MM-DD'),
      label: refDate.format('YYYY年M月'),
    }
  }
  return {
    start: refDate.startOf('year').format('YYYY-MM-DD'),
    end: refDate.endOf('year').format('YYYY-MM-DD'),
    label: refDate.format('YYYY年'),
  }
}

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets()
  const [period, setPeriod] = useState<Period>('month')
  const [referenceDate, setReferenceDate] = useState(dayjs())

  const workRecords = useAtomValue(workRecordsAtom)
  const expenseRecords = useAtomValue(expenseRecordsAtom)
  const categories = useAtomValue(categoriesAtom)
  const settings = useAtomValue(settingsAtom)

  const { start: periodStart, end: periodEnd, label: periodLabel } = useMemo(
    () => getPeriodRange(referenceDate, period, settings.weekStart),
    [referenceDate, period, settings.weekStart],
  )

  const goToPrev = () => {
    setReferenceDate(prev => prev.subtract(1, period))
  }

  const goToNext = () => {
    setReferenceDate(prev => prev.add(1, period))
  }

  const goToToday = () => {
    setReferenceDate(dayjs())
  }

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>()
    for (const cat of categories) {
      map.set(cat.id, cat)
    }
    return map
  }, [categories])

  const workStats = useMemo(() => {
    const wr = Array.isArray(workRecords) ? workRecords : []
    const filtered = wr.filter(r => r.date >= periodStart && r.date <= periodEnd)

    if (filtered.length === 0) {
      return { totalHours: 0, days: 0, estimatedIncome: 0 }
    }

    const totalHours = filtered.reduce((sum, r) => sum + r.durationHours, 0)
    const days = new Set(filtered.map(r => r.date)).size
    const estimatedIncome = totalHours * settings.defaultHourlyRate

    return { totalHours, days, estimatedIncome }
  }, [workRecords, periodStart, periodEnd, settings.defaultHourlyRate])

  const expenseStats = useMemo(() => {
    const er = Array.isArray(expenseRecords) ? expenseRecords : []
    const filtered = er.filter(r => r.date >= periodStart && r.date <= periodEnd)

    const totalIncome = filtered
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0)

    const totalExpense = filtered
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0)

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, count: filtered.length }
  }, [expenseRecords, periodStart, periodEnd])

  const expenseByCategory = useMemo(() => {
    const er = Array.isArray(expenseRecords) ? expenseRecords : []
    const filtered = er.filter(r => r.date >= periodStart && r.date <= periodEnd)

    const map = new Map<string, { category: Category | null, amount: number, type: string }>()
    for (const r of filtered) {
      const existing = map.get(r.categoryId)
      if (existing) {
        existing.amount += r.amount
      } else {
        map.set(r.categoryId, {
          category: categoryMap.get(r.categoryId) ?? null,
          amount: r.amount,
          type: r.type,
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
  }, [expenseRecords, periodStart, periodEnd, categoryMap])

  const isCurrentPeriod = useMemo(() => {
    const today = dayjs()
    if (period === 'week') {
      const curr = getWeekRange(today, settings.weekStart)
      return periodStart === curr.start
    }
    if (period === 'month') {
      return referenceDate.format('YYYY-MM') === today.format('YYYY-MM')
    }
    return referenceDate.format('YYYY') === today.format('YYYY')
  }, [period, periodStart, referenceDate, settings.weekStart])

  const StatCard = ({ children }: { children: React.ReactNode }) => (
    <YStack
      bg="$backgroundHover"
      rounded="$4"
      px="$4"
      py="$3.5"
      gap="$2"
    >
      {children}
    </YStack>
  )

  const StatRow = ({ label, value, color }: { label: string, value: string, color?: string }) => (
    <XStack items="center" justify="space-between">
      <Text fontSize="$3" color="$color10">{label}</Text>
      <Text fontSize="$4" fontWeight="600" color={(color ?? '$color') as any}>
        {value}
      </Text>
    </XStack>
  )

  return (
    <View flex={1} bg="$background">
      {/* Fixed Header */}
      <YStack pt={insets.top + 16} bg="$background" pb="$3">
        <XStack
          items="center"
          justify="space-between"
          px="$3"
        >
          {/* Title */}
          <Text fontSize="$5" fontWeight="700" mr="$1">
            统计
          </Text>

          {/* Period Navigation */}
          <XStack items="center" gap="$1" flex={1} justify="center">
            <Button
              size="$2"
              chromeless
              onPress={goToPrev}
            >
              <ChevronLeft size="$1" />
            </Button>
            <Text fontSize="$3" fontWeight="500" color="$color10" numberOfLines={1}>
              {periodLabel}
            </Text>
            <Button
              size="$2"
              chromeless
              onPress={goToNext}
            >
              <ChevronRight size="$1" />
            </Button>
            {!isCurrentPeriod && (
              <Button size="$1" chromeless onPress={goToToday}>
                今天
              </Button>
            )}
          </XStack>

          {/* Period Selector */}
          <XStack gap="$1" ml="$1">
            {([
              { key: 'week', label: '周' },
              { key: 'month', label: '月' },
              { key: 'year', label: '年' },
            ] as { key: Period, label: string }[]).map(p => (
              <Button
                key={p.key}
                size="$2"
                bg={(period === p.key ? '$blue10' : '$backgroundHover') as any}
                color={period === p.key ? 'white' : '$color'}
                onPress={() => setPeriod(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </XStack>
        </XStack>
      </YStack>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Work Statistics */}
        <YStack px="$4" pb="$4" gap="$2">
          <Text fontSize="$4" fontWeight="700">
            工时统计
          </Text>
          <StatCard>
            {workStats.totalHours === 0 && workStats.days === 0
              ? (
                  <Text fontSize="$3" color="$color10" py="$2" style={{ textAlign: 'center' }}>
                    暂无工时记录
                  </Text>
                )
              : (
                  <>
                    <StatRow
                      label="总工时"
                      value={formatDuration(workStats.totalHours)}
                      color="$blue10"
                    />
                    <Separator />
                    <StatRow
                      label="工作天数"
                      value={`${workStats.days} 天`}
                    />
                    <Separator />
                    <StatRow
                      label="预估收入"
                      value={`${settings.currency === 'CNY' ? '¥' : '$'}${workStats.estimatedIncome.toFixed(2)}`}
                      color="$green10"
                    />
                  </>
                )}
          </StatCard>
        </YStack>

        {/* Expense Statistics */}
        <YStack px="$4" pb="$4" gap="$2">
          <Text fontSize="$4" fontWeight="700">
            记账统计
          </Text>
          <StatCard>
            {expenseStats.count === 0
              ? (
                  <Text fontSize="$3" color="$color10" py="$2" style={{ textAlign: 'center' }}>
                    暂无记账记录
                  </Text>
                )
              : (
                  <>
                    <StatRow
                      label="收入"
                      value={`${settings.currency === 'CNY' ? '¥' : '$'}${expenseStats.totalIncome.toFixed(2)}`}
                      color="$green10"
                    />
                    <Separator />
                    <StatRow
                      label="支出"
                      value={`${settings.currency === 'CNY' ? '¥' : '$'}${expenseStats.totalExpense.toFixed(2)}`}
                      color="$red10"
                    />
                    <Separator />
                    <StatRow
                      label="结余"
                      value={`${settings.currency === 'CNY' ? '¥' : '$'}${expenseStats.balance.toFixed(2)}`}
                      color={expenseStats.balance >= 0 ? '$green10' : '$red10'}
                    />
                  </>
                )}
          </StatCard>
        </YStack>

        {/* Category Breakdown */}
        {expenseByCategory.length > 0 && (
          <YStack px="$4" pb="$8" gap="$2">
            <Text fontSize="$4" fontWeight="700">
              分类明细
            </Text>

            {/* Income categories */}
            {expenseByCategory.filter(c => c.type === 'income').length > 0 && (
              <StatCard>
                <Text fontSize="$2" fontWeight="600" color="$color10" pb="$1">
                  收入分类
                </Text>
                {expenseByCategory
                  .filter(c => c.type === 'income')
                  .map((item, i, arr) => (
                    <View key={item.category?.id ?? 'unknown'}>
                      <XStack items="center" justify="space-between">
                        <XStack items="center" gap="$2">
                          <RNView
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: item.category?.color ?? '#4CAF50',
                            }}
                          />
                          <Text fontSize="$3">
                            {item.category?.name ?? '未知'}
                          </Text>
                        </XStack>
                        <Text fontSize="$3" fontWeight="500" color="$green10">
                          {settings.currency === 'CNY' ? '¥' : '$'}{item.amount.toFixed(2)}
                        </Text>
                      </XStack>
                      {i < arr.length - 1 && <Separator my="$2" />}
                    </View>
                  ))}
              </StatCard>
            )}

            {/* Expense categories */}
            {expenseByCategory.filter(c => c.type === 'expense').length > 0 && (
              <StatCard>
                <Text fontSize="$2" fontWeight="600" color="$color10" pb="$1">
                  支出分类
                </Text>
                {expenseByCategory
                  .filter(c => c.type === 'expense')
                  .map((item, i, arr) => (
                    <View key={item.category?.id ?? 'unknown'}>
                      <XStack items="center" justify="space-between">
                        <XStack items="center" gap="$2">
                          <RNView
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: item.category?.color ?? '#888',
                            }}
                          />
                          <Text fontSize="$3">
                            {item.category?.name ?? '未知'}
                          </Text>
                        </XStack>
                        <Text fontSize="$3" fontWeight="500" color="$red10">
                          {settings.currency === 'CNY' ? '¥' : '$'}{item.amount.toFixed(2)}
                        </Text>
                      </XStack>
                      {i < arr.length - 1 && <Separator my="$2" />}
                    </View>
                  ))}
              </StatCard>
            )}
          </YStack>
        )}
      </ScrollView>
    </View>
  )
}
